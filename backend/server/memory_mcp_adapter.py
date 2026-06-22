from __future__ import annotations

from typing import Any, Dict

from server.memory_schemas import MemoryCreateRequest, MemorySearchRequest
from server.memory_service import MemoryService


class MemoryMCPAdapter:
    """Thin adapter that preserves a stable MCP-oriented interface over MemoryService."""

    def __init__(self, memory_service: MemoryService):
        self._memory_service = memory_service

    def capabilities(self) -> Dict[str, Any]:
        return {
            "tools": [
                {
                    "name": "memory.search",
                    "description": "Search relevant long-term research memories before starting or continuing research.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "limit": {"type": "integer", "default": 5},
                        },
                        "required": ["query"],
                    },
                },
                {
                    "name": "memory.list",
                    "description": "List current long-term memories with optional type and status filters.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "memory_type": {"type": "string"},
                            "status": {"type": "string", "default": "active"},
                        },
                    },
                },
                {
                    "name": "memory.save",
                    "description": "Persist a user-approved long-term memory item.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "title": {"type": "string"},
                            "content": {"type": "string"},
                            "summary": {"type": "string"},
                            "tags": {"type": "array", "items": {"type": "string"}},
                            "source": {"type": "object"},
                            "confidence": {"type": "string"},
                        },
                        "required": ["type", "title", "content", "source"],
                    },
                },
                {
                    "name": "memory.delete",
                    "description": "Delete an existing long-term memory so it is no longer reused.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "memory_id": {"type": "string"},
                        },
                        "required": ["memory_id"],
                    },
                },
            ]
        }

    async def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        result = await self._memory_service.search(MemorySearchRequest(query=query, limit=limit))
        return result.model_dump(mode="json")

    async def list(self, memory_type: str | None = None, status: str | None = "active") -> Dict[str, Any]:
        items = await self._memory_service.list_items(memory_type=memory_type, status=status)
        return {"items": [item.model_dump(mode="json") for item in items]}

    async def save(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item = await self._memory_service.create_item(MemoryCreateRequest.model_validate(payload))
        return {"item": item.model_dump(mode="json")}

    async def delete(self, memory_id: str) -> Dict[str, Any]:
        deleted = await self._memory_service.delete_item(memory_id)
        return {"success": deleted, "memory_id": memory_id}
