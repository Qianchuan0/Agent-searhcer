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
            raise ValueError("长期记忆已关闭，当前不能写入记忆。")
        self._raise_if_sensitive(request.title, request.content)
        now = self._now()
        item = MemoryItem(
            id=f"memory_{uuid4().hex}",
            type=request.type,
            title=request.title.strip(),
            core_claim=self._normalize_core_claim(request.type, request.core_claim, request.title, request.content),
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
        next_type = item.type
        self._raise_if_sensitive(new_title, new_content)

        updated = item.model_copy(
            update={
                "title": new_title,
                "core_claim": self._normalize_core_claim(
                    next_type,
                    request.core_claim if request.core_claim is not None else item.core_claim,
                    new_title,
                    new_content,
                ),
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
        if self._contains_sensitive(question, answer):
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
            core_claim=self._build_core_claim(question, answer),
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

        ranked.sort(key=self._search_sort_key)
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
        if self._contains_sensitive(question, answer):
            return MemorySuggestionsResponse(
                suggestions=[],
                metadata={
                    "blocked": True,
                    "reason": "检测到疑似敏感信息，本次不会生成长期记忆建议。",
                },
            )

        suggestions: List[MemorySuggestion] = []
        summary = self._build_summary(question, answer)
        excerpt = self._truncate(answer or question, 220)
        tags = self._extract_tags([question, answer])

        if summary:
            suggestion = self._build_safe_suggestion(
                MemorySuggestion(
                    id=f"suggestion_{uuid4().hex}",
                    type="research_knowledge",
                    title=self._truncate(question or "Research takeaway", 80),
                    core_claim=self._build_core_claim(question, answer),
                    content=summary,
                    reason="This report appears reusable as future research context.",
                    source_excerpt=excerpt,
                    source=MemorySource(kind="report", report_id=request.report_id, created_from="memory_suggestion"),
                    tags=tags,
                    confidence="medium",
                )
            )
            if suggestion is not None:
                suggestions.append(suggestion)

        if question:
            suggestion = self._build_safe_suggestion(
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
            if suggestion is not None:
                suggestions.append(suggestion)

        return MemorySuggestionsResponse(
            suggestions=suggestions[:4],
            metadata={"blocked": False, "count": min(len(suggestions), 4)},
        )

    async def classify_research(
        self,
        request: ResearchClassificationRequest,
    ) -> ResearchClassificationResponse:
        limit = max(5, len(request.candidate_memory_ids) or 5)
        search_results = await self.search(MemorySearchRequest(query=request.query, limit=limit))
        if request.candidate_memory_ids:
            candidate_ids = set(request.candidate_memory_ids)
            search_results = MemorySearchResponse(
                results=[result for result in search_results.results if result.item.id in candidate_ids]
            )

        bridge_results = [
            result
            for result in search_results.results
            if result.item.type != "user_preference" and self._bridge_bucket(result.item) != 3
        ]

        query = request.query.lower()

        relation = "new_topic"
        reason = "No relevant long-term memory was found."
        strategy = "Start a fresh research flow."

        if (
            "compare" in query
            or "vs" in query
            or "\u5bf9\u6bd4" in request.query
            or "\u6bd4\u8f83" in request.query
        ):
            relation = "compare"
            reason = "The query explicitly asks for a comparison with related prior research."
            strategy = "Reuse the closest prior memories and highlight differences."
        elif any(word in query for word in ["latest", "update", "refresh", "today"]) or any(
            word in request.query
            for word in [
                "\u6700\u8fd1",
                "\u6700\u65b0",
                "\u5237\u65b0",
                "\u8fdb\u5c55",
                "\u73b0\u72b6",
            ]
        ):
            relation = "refresh"
            reason = "The query suggests prior knowledge may need to be refreshed."
            strategy = "Reuse prior context, then verify which conclusions still hold."
        elif bridge_results and bridge_results[0].score >= 0.2:
            relation = "follow_up"
            reason = "Relevant prior memories were found with meaningful topic overlap."
            strategy = "Carry over the strongest prior findings as context and focus on new additions."

        return ResearchClassificationResponse(
            relation=relation,
            reason=reason,
            suggested_strategy=strategy,
            related_memories=bridge_results,
        )

    async def get_report_memory(self, report_id: str) -> ReportMemoryResponse:
        report = await self._report_store.get_report(report_id)
        if report is None:
            return ReportMemoryResponse(report_id=report_id, memories=[], findings=[], metadata={"count": 0})

        memories = await self.list_items(status="active")
        adopted_memory_ids, adopted_findings = self._extract_adopted_memories(report)
        adopted_id_set = set(adopted_memory_ids)
        adopted_memories = [item for item in memories if item.id in adopted_id_set]

        report_memories = [item for item in memories if item.source.report_id == report_id]
        new_findings = [
            finding for item in report_memories if (finding := self._build_finding(item)) is not None
        ]

        return ReportMemoryResponse(
            report_id=report_id,
            memories=adopted_memories,
            findings=adopted_findings,
            metadata={
                "count": len(adopted_findings),
                "adopted_memory_ids": adopted_memory_ids,
                "new_findings": [finding.model_dump(mode="json") for finding in new_findings],
            },
        )

    def _extract_adopted_memories(self, report: dict) -> tuple[List[str], List[ResearchFinding]]:
        selected_memories = report.get("adopted_memories_snapshot") or []
        if not isinstance(selected_memories, list) or not selected_memories:
            ordered_data = report.get("orderedData") or []
            if not isinstance(ordered_data, list):
                return [], []

            selected_memories = []
            for entry in reversed(ordered_data):
                if not isinstance(entry, dict):
                    continue
                metadata = entry.get("metadata")
                if not isinstance(metadata, dict):
                    continue
                if metadata.get("stage") != "memory_bridge_confirmed":
                    continue
                raw_selected = metadata.get("selected_memories")
                if isinstance(raw_selected, list):
                    selected_memories = raw_selected
                    break

        findings: List[ResearchFinding] = []
        adopted_ids: List[str] = []
        for raw in selected_memories:
            if not isinstance(raw, dict):
                continue
            memory_id = str(raw.get("id") or "").strip()
            if not memory_id:
                continue
            adopted_ids.append(memory_id)
            findings.append(
                ResearchFinding(
                    id=f"finding_{uuid4().hex}",
                    memory_id=memory_id,
                    claim=str(raw.get("core_claim") or raw.get("summary") or raw.get("title") or "").strip(),
                    evidence_summary=str(raw.get("summary") or "").strip(),
                    source_report_id=str(raw.get("reportId") or "unknown"),
                    confidence=str(raw.get("confidence") or "medium"),
                    generated_at=self._now(),
                    staleness=str(raw.get("staleness") or "possibly_stale"),
                )
            )

        return adopted_ids, findings

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
            claim=item.core_claim or item.summary,
            evidence_summary=self._truncate(item.content, 220),
            source_report_id=item.source.report_id,
            confidence=item.confidence,
            generated_at=self._now(),
            staleness="possibly_stale" if item.type == "report_index" else "fresh",
        )

    def _score_item(self, item: MemoryItem, query_tokens: Sequence[str]) -> tuple[float, List[str]]:
        haystack = " ".join(
            [item.title, item.core_claim or "", item.summary, item.content, " ".join(item.tags)]
        ).lower()
        matched_terms = [token for token in query_tokens if token and token in haystack]
        if not matched_terms:
            return 0.0, []

        unique_query_tokens = len(set(query_tokens)) or 1
        lexical_score = len(set(matched_terms)) / unique_query_tokens
        type_bonus = 0.08 if item.type == "research_knowledge" else 0.05 if item.type == "report_index" else 0.0
        bridge_bonus = 0.04 if self._bridge_bucket(item) == 0 else 0.0
        fallback_penalty = -0.05 if self._bridge_bucket(item) == 2 else 0.0
        confidence_bonus = {"low": 0.0, "medium": 0.03, "high": 0.06}[item.confidence]
        return min(1.0, max(0.0, lexical_score + type_bonus + bridge_bonus + fallback_penalty + confidence_bonus)), sorted(set(matched_terms))

    def _search_sort_key(self, entry: MemorySearchResult) -> tuple[float, int, float, float]:
        item = entry.item
        return (
            self._bridge_bucket(item),
            -entry.score,
            -1.0 if item.core_claim else 0.0,
            -item.created_at.timestamp(),
        )

    def _bridge_bucket(self, item: MemoryItem) -> int:
        if item.type in {"research_knowledge", "report_index"} and item.core_claim:
            return 0
        if item.type in {"saved_context", "research_interest"}:
            return 1
        if item.type in {"research_knowledge", "report_index"}:
            return 2
        return 3

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

    def _build_core_claim(self, question: str, answer: str) -> str:
        source = answer.strip() or question.strip()
        if not source:
            return ""

        normalized = re.sub(r"\s+", " ", source).strip()
        if normalized.startswith("#"):
            normalized = normalized.lstrip("#").strip()

        sentence_split = re.split(r"(?<=[。！？.!?])\s+|\n+", normalized)
        first_sentence = next((segment.strip() for segment in sentence_split if segment.strip()), normalized)
        return self._truncate(first_sentence, 120)

    def _normalize_core_claim(
        self,
        memory_type: str,
        core_claim: str | None,
        title: str,
        content: str,
    ) -> str | None:
        cleaned = core_claim.strip() if isinstance(core_claim, str) else ""
        if cleaned:
            return self._truncate(cleaned, 120)
        if memory_type in {"research_knowledge", "report_index"}:
            return self._build_core_claim(title, content)
        return None

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

    def _build_safe_suggestion(self, suggestion: MemorySuggestion) -> MemorySuggestion | None:
        if self._contains_sensitive(suggestion.title, suggestion.content, suggestion.source_excerpt):
            return None
        return suggestion

    def _contains_sensitive(self, *values: str) -> bool:
        combined = "\n".join(values)
        sensitive_patterns = [
            r"api[_-]?key\s*[:=]",
            r"sk-[a-z0-9]{16,}",
            r"-----begin [a-z ]*private key-----",
            r"password\s*[:=]",
            r"token\s*[:=]",
        ]
        lowered = combined.lower()
        return any(re.search(pattern, lowered, re.IGNORECASE) for pattern in sensitive_patterns)

    def _raise_if_sensitive(self, *values: str) -> None:
        if self._contains_sensitive(*values):
            raise ValueError("检测到疑似敏感信息，长期记忆不会保存 API Key、Token、密码或私钥。")

    def _now(self) -> datetime:
        return datetime.now(UTC)
