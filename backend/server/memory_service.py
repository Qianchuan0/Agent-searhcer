from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Dict, Iterable, List, Sequence
from uuid import uuid4

from server.memory_schemas import (
    MemoryCreateRequest,
    MemoryItem,
    MemorySearchRequest,
    MemorySearchResult,
    MemorySearchResponse,
    MemorySettings,
    MemorySettingsUpdateRequest,
    MemorySource,
    MemorySuggestion,
    MemorySuggestionsResponse,
    MemorySuggestionRequest,
    MemoryUpdateRequest,
    ReportMemoryResponse,
    ResearchClassificationRequest,
    ResearchClassificationResponse,
    ResearchFinding,
)
from server.memory_store import MemoryStore
from server.report_store import ReportStore


class MemoryService:
    def __init__(self, store: MemoryStore, report_store: ReportStore):
        self._store = store
        self._report_store = report_store

    async def get_settings(self) -> MemorySettings:
        payload = await self._store.read_all()
        return MemorySettings.model_validate(payload.get("settings") or {})

    async def update_settings(self, request: MemorySettingsUpdateRequest) -> MemorySettings:
        payload = await self._store.read_all()
        settings = MemorySettings(enabled=request.enabled, updated_at=self._now())
        payload["settings"] = settings.model_dump(mode="json")
        await self._store.write_all(payload)
        return settings

    async def list_items(
        self,
        memory_type: str | None = None,
        status: str | None = None,
        tag: str | None = None,
    ) -> List[MemoryItem]:
        payload = await self._store.read_all()
        items = [MemoryItem.model_validate(item) for item in (payload.get("items") or {}).values()]
        filtered = []
        for item in items:
            if memory_type and item.type != memory_type:
                continue
            if status and item.status != status:
                continue
            if tag and tag not in item.tags:
                continue
            filtered.append(item)
        return sorted(filtered, key=lambda item: item.updated_at, reverse=True)

    async def create_item(self, request: MemoryCreateRequest) -> MemoryItem:
        settings = await self.get_settings()
        if not settings.enabled:
            raise ValueError("Long-term memory is disabled.")
        self._raise_if_sensitive(request.title, request.content)
        now = self._now()
        item = MemoryItem(
            id=f"memory_{uuid4().hex}",
            type=request.type,
            title=request.title.strip(),
            content=request.content.strip(),
            summary=(request.summary or request.content.strip())[:180],
            tags=self._dedupe_tags(request.tags),
            source=request.source,
            confidence=request.confidence,
            created_at=now,
            updated_at=now,
            expires_at=request.expires_at,
        )
        payload = await self._store.read_all()
        payload.setdefault("items", {})[item.id] = item.model_dump(mode="json")
        await self._store.write_all(payload)
        return item

    async def update_item(self, memory_id: str, request: MemoryUpdateRequest) -> MemoryItem | None:
        payload = await self._store.read_all()
        raw = (payload.get("items") or {}).get(memory_id)
        if raw is None:
            return None
        item = MemoryItem.model_validate(raw)

        new_title = request.title.strip() if request.title is not None else item.title
        new_content = request.content.strip() if request.content is not None else item.content
        self._raise_if_sensitive(new_title, new_content)

        updated = item.model_copy(
            update={
                "title": new_title,
                "content": new_content,
                "summary": (request.summary if request.summary is not None else item.summary)[:180],
                "tags": self._dedupe_tags(request.tags) if request.tags is not None else item.tags,
                "confidence": request.confidence or item.confidence,
                "status": request.status or item.status,
                "expires_at": request.expires_at if request.expires_at is not None else item.expires_at,
                "updated_at": self._now(),
            }
        )
        payload["items"][memory_id] = updated.model_dump(mode="json")
        await self._store.write_all(payload)
        return updated

    async def delete_item(self, memory_id: str) -> bool:
        payload = await self._store.read_all()
        raw = (payload.get("items") or {}).get(memory_id)
        if raw is None:
            return False
        item = MemoryItem.model_validate(raw)
        deleted = item.model_copy(update={"status": "deleted", "updated_at": self._now()})
        payload["items"][memory_id] = deleted.model_dump(mode="json")
        await self._store.write_all(payload)
        return True

    async def index_report(self, report_id: str) -> MemoryItem | None:
        settings = await self.get_settings()
        if not settings.enabled:
            return None
        report = await self._report_store.get_report(report_id)
        if report is None:
            return None

        question = (report.get("question") or "").strip()
        answer = (report.get("answer") or "").strip()
        if not question and not answer:
            return None

        payload = await self._store.read_all()
        items = payload.setdefault("items", {})
        existing_id, existing_item = self._find_report_index(items, report_id)
        now = self._now()
        content = f"Question: {question}\n\nSummary:\n{self._summarize_answer(answer)}".strip()
        summary = self._build_summary(question, answer)
        tags = self._extract_tags([question, answer])

        base_item = MemoryItem(
            id=existing_id or f"memory_{uuid4().hex}",
            type="report_index",
            title=question[:120] or f"Report {report_id}",
            content=content,
            summary=summary,
            tags=tags,
            source=MemorySource(kind="report", report_id=report_id, created_from="report_index"),
            confidence="high",
            created_at=existing_item.created_at if existing_item else now,
            updated_at=now,
            last_used_at=existing_item.last_used_at if existing_item else None,
        )
        items[base_item.id] = base_item.model_dump(mode="json")
        await self._store.write_all(payload)
        return base_item

    async def search(self, request: MemorySearchRequest) -> MemorySearchResponse:
        settings = await self.get_settings()
        if not settings.enabled:
            return MemorySearchResponse(results=[])

        items = await self.list_items(status="active")
        tokens = self._tokenize(request.query)
        ranked: List[MemorySearchResult] = []
        for item in items:
            score, matched_terms = self._score_item(item, tokens)
            if score <= 0:
                continue
            finding = self._build_finding(item)
            ranked.append(
                MemorySearchResult(
                    item=item,
                    score=score,
                    matched_terms=matched_terms,
                    findings=[finding] if finding else [],
                )
            )

        ranked.sort(key=lambda entry: entry.score, reverse=True)
        top_results = ranked[: max(1, min(request.limit, 20))]

        if top_results:
            payload = await self._store.read_all()
            for result in top_results:
                refreshed = result.item.model_copy(update={"last_used_at": self._now()})
                payload["items"][refreshed.id] = refreshed.model_dump(mode="json")
                result.item = refreshed
            await self._store.write_all(payload)

        return MemorySearchResponse(results=top_results)

    async def generate_suggestions(self, request: MemorySuggestionRequest) -> MemorySuggestionsResponse:
        settings = await self.get_settings()
        report = await self._report_store.get_report(request.report_id)
        if not settings.enabled or report is None:
            return MemorySuggestionsResponse(suggestions=[])

        question = (report.get("question") or "").strip()
        answer = (report.get("answer") or "").strip()
        if not question and not answer:
            return MemorySuggestionsResponse(suggestions=[])

        suggestions: List[MemorySuggestion] = []
        summary = self._build_summary(question, answer)
        excerpt = self._truncate(answer or question, 220)
        tags = self._extract_tags([question, answer])

        if summary:
            suggestions.append(
                MemorySuggestion(
                    id=f"suggestion_{uuid4().hex}",
                    type="research_knowledge",
                    title=self._truncate(question or "Research takeaway", 80),
                    content=summary,
                    reason="This report appears reusable as future research context.",
                    source_excerpt=excerpt,
                    source=MemorySource(kind="report", report_id=request.report_id, created_from="memory_suggestion"),
                    tags=tags,
                    confidence="medium",
                )
            )

        if question:
            suggestions.append(
                MemorySuggestion(
                    id=f"suggestion_{uuid4().hex}",
                    type="saved_context",
                    title=f"Context: {self._truncate(question, 60)}",
                    content=f"User previously researched: {question}",
                    reason="This can help continue the same topic later without restating the original brief.",
                    source_excerpt=self._truncate(question, 180),
                    source=MemorySource(kind="report", report_id=request.report_id, created_from="memory_suggestion"),
                    tags=tags,
                    confidence="medium",
                )
            )

        return MemorySuggestionsResponse(suggestions=suggestions[:4])

    async def classify_research(
        self,
        request: ResearchClassificationRequest,
    ) -> ResearchClassificationResponse:
        search_results = await self.search(MemorySearchRequest(query=request.query, limit=5))
        query = request.query.lower()

        relation = "new_topic"
        reason = "No relevant long-term memory was found."
        strategy = "Start a fresh research flow."

        if "compare" in query or "vs" in query or "对比" in request.query or "比较" in request.query:
            relation = "compare"
            reason = "The query explicitly asks for a comparison with related prior research."
            strategy = "Reuse the closest prior memories and highlight differences."
        elif any(word in query for word in ["latest", "update", "refresh", "today", "最近", "最新", "刷新"]):
            relation = "refresh"
            reason = "The query suggests prior knowledge may need to be refreshed."
            strategy = "Reuse prior context, then verify which conclusions still hold."
        elif search_results.results and search_results.results[0].score >= 0.2:
            relation = "follow_up"
            reason = "Relevant prior memories were found with meaningful topic overlap."
            strategy = "Carry over the strongest prior findings as context and focus on new additions."

        return ResearchClassificationResponse(
            relation=relation,
            reason=reason,
            suggested_strategy=strategy,
            related_memories=search_results.results,
        )

    async def get_report_memory(self, report_id: str) -> ReportMemoryResponse:
        memories = await self.list_items(status="active")
        related = [item for item in memories if item.source.report_id == report_id]
        findings = [finding for item in related if (finding := self._build_finding(item)) is not None]
        return ReportMemoryResponse(
            report_id=report_id,
            memories=related,
            findings=findings,
            metadata={"count": len(related)},
        )

    def _find_report_index(self, items: Dict[str, dict], report_id: str) -> tuple[str | None, MemoryItem | None]:
        for memory_id, raw in items.items():
            item = MemoryItem.model_validate(raw)
            if item.type == "report_index" and item.source.report_id == report_id and item.status != "deleted":
                return memory_id, item
        return None, None

    def _build_finding(self, item: MemoryItem) -> ResearchFinding | None:
        if item.type not in {"research_knowledge", "report_index"} or not item.source.report_id:
            return None
        return ResearchFinding(
            id=f"finding_{uuid4().hex}",
            memory_id=item.id,
            claim=item.summary,
            evidence_summary=self._truncate(item.content, 220),
            source_report_id=item.source.report_id,
            confidence=item.confidence,
            generated_at=self._now(),
            staleness="possibly_stale" if item.type == "report_index" else "fresh",
        )

    def _score_item(self, item: MemoryItem, query_tokens: Sequence[str]) -> tuple[float, List[str]]:
        haystack = " ".join([item.title, item.summary, item.content, " ".join(item.tags)]).lower()
        matched_terms = [token for token in query_tokens if token and token in haystack]
        if not matched_terms:
            return 0.0, []

        unique_query_tokens = len(set(query_tokens)) or 1
        lexical_score = len(set(matched_terms)) / unique_query_tokens
        type_bonus = 0.05 if item.type in {"research_knowledge", "report_index"} else 0.0
        confidence_bonus = {"low": 0.0, "medium": 0.03, "high": 0.06}[item.confidence]
        return min(1.0, lexical_score + type_bonus + confidence_bonus), sorted(set(matched_terms))

    def _tokenize(self, text: str) -> List[str]:
        normalized = re.sub(r"[^\w\u4e00-\u9fff]+", " ", text.lower())
        return [token for token in normalized.split() if len(token) >= 2]

    def _extract_tags(self, texts: Iterable[str]) -> List[str]:
        tag_candidates: List[str] = []
        for text in texts:
            for token in self._tokenize(text):
                if token not in {"what", "with", "this", "that", "from", "about", "into", "have"}:
                    tag_candidates.append(token[:24])
        return self._dedupe_tags(tag_candidates)[:8]

    def _dedupe_tags(self, tags: Iterable[str]) -> List[str]:
        seen = set()
        deduped = []
        for tag in tags:
            clean = tag.strip()
            if not clean:
                continue
            lowered = clean.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(clean)
        return deduped

    def _build_summary(self, question: str, answer: str) -> str:
        summary_source = answer.strip() or question.strip()
        return self._truncate(re.sub(r"\s+", " ", summary_source), 180)

    def _summarize_answer(self, answer: str) -> str:
        stripped = re.sub(r"\s+", " ", answer).strip()
        if not stripped:
            return ""
        paragraphs = [segment.strip() for segment in re.split(r"\n{2,}", answer) if segment.strip()]
        if paragraphs:
            return self._truncate(paragraphs[0], 320)
        return self._truncate(stripped, 320)

    def _truncate(self, text: str, limit: int) -> str:
        text = text.strip()
        if len(text) <= limit:
            return text
        return f"{text[: max(0, limit - 3)]}..."

    def _raise_if_sensitive(self, *values: str) -> None:
        combined = "\n".join(values)
        sensitive_patterns = [
            r"api[_-]?key\s*[:=]",
            r"sk-[a-z0-9]{16,}",
            r"-----begin [a-z ]*private key-----",
            r"password\s*[:=]",
            r"token\s*[:=]",
        ]
        lowered = combined.lower()
        if any(re.search(pattern, lowered, re.IGNORECASE) for pattern in sensitive_patterns):
            raise ValueError("Sensitive information cannot be stored in long-term memory.")

    def _now(self) -> datetime:
        return datetime.now(UTC)
