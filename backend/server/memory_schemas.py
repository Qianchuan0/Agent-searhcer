from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

MemoryType = Literal[
    "user_preference",
    "research_interest",
    "research_knowledge",
    "saved_context",
    "report_index",
]
MemoryStatus = Literal["active", "disabled", "deleted"]
MemoryConfidence = Literal["low", "medium", "high"]
MemorySourceKind = Literal["report", "conversation", "user_action"]
ResearchRelation = Literal["new_topic", "follow_up", "refresh", "compare"]
Staleness = Literal["fresh", "possibly_stale", "stale"]


class MemorySource(BaseModel):
    kind: MemorySourceKind
    report_id: Optional[str] = None
    message_id: Optional[str] = None
    created_from: Optional[str] = None


class MemoryItem(BaseModel):
    id: str
    scope: Literal["local"] = "local"
    type: MemoryType
    title: str
    content: str
    summary: str
    tags: List[str] = Field(default_factory=list)
    source: MemorySource
    confidence: MemoryConfidence = "medium"
    status: MemoryStatus = "active"
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    embedding_id: Optional[str] = None


class ResearchFinding(BaseModel):
    id: str
    memory_id: str
    claim: str
    evidence_summary: str
    source_report_id: str
    source_urls: List[str] = Field(default_factory=list)
    confidence: MemoryConfidence = "medium"
    generated_at: datetime
    staleness: Staleness = "fresh"


class MemorySuggestion(BaseModel):
    id: str
    type: Literal["user_preference", "research_interest", "research_knowledge", "saved_context"]
    title: str
    content: str
    reason: str
    source_excerpt: str
    default_action: Literal["review"] = "review"
    source: MemorySource
    tags: List[str] = Field(default_factory=list)
    confidence: MemoryConfidence = "medium"


class MemorySettings(BaseModel):
    enabled: bool = False
    updated_at: datetime


class MemoryCreateRequest(BaseModel):
    type: MemoryType
    title: str
    content: str
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source: MemorySource
    confidence: MemoryConfidence = "medium"
    expires_at: Optional[datetime] = None


class MemoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    confidence: Optional[MemoryConfidence] = None
    status: Optional[MemoryStatus] = None
    expires_at: Optional[datetime] = None


class MemorySettingsUpdateRequest(BaseModel):
    enabled: bool


class MemorySearchRequest(BaseModel):
    query: str
    limit: int = 5


class MemorySearchResult(BaseModel):
    item: MemoryItem
    score: float
    matched_terms: List[str] = Field(default_factory=list)
    findings: List[ResearchFinding] = Field(default_factory=list)


class MemorySearchResponse(BaseModel):
    results: List[MemorySearchResult]


class MemorySuggestionRequest(BaseModel):
    report_id: str


class MemorySuggestionsResponse(BaseModel):
    suggestions: List[MemorySuggestion]


class ResearchClassificationRequest(BaseModel):
    query: str
    candidate_memory_ids: List[str] = Field(default_factory=list)


class ResearchClassificationResponse(BaseModel):
    relation: ResearchRelation
    reason: str
    suggested_strategy: str
    related_memories: List[MemorySearchResult] = Field(default_factory=list)


class ReportMemoryResponse(BaseModel):
    report_id: str
    memories: List[MemoryItem]
    findings: List[ResearchFinding]
    metadata: Dict[str, Any] = Field(default_factory=dict)
