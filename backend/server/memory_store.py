from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any, Dict
from datetime import UTC, datetime

from server.memory_schemas import MemorySettings


class MemoryStore:
    def __init__(self, path: Path):
        self._path = path
        self._lock = asyncio.Lock()

    async def _ensure_parent_dir(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)

    async def _read_unlocked(self) -> Dict[str, Any]:
        if not self._path.exists():
            return self._default_payload()
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                payload = self._default_payload()
                payload.update(data)
                return payload
        except Exception:
            self._backup_corrupted_file()
            return self._default_payload()
        self._backup_corrupted_file()
        return self._default_payload()

    async def _write_unlocked(self, data: Dict[str, Any]) -> None:
        await self._ensure_parent_dir()
        tmp_path = self._path.with_suffix(self._path.suffix + ".tmp")
        tmp_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(self._path)

    def _default_payload(self) -> Dict[str, Any]:
        return {
            "settings": MemorySettings(enabled=False, updated_at="1970-01-01T00:00:00+00:00").model_dump(mode="json"),
            "items": {},
        }

    def _backup_corrupted_file(self) -> None:
        if not self._path.exists():
            return
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        backup_path = self._path.with_name(f"{self._path.name}.corrupt-{timestamp}")
        try:
            self._path.replace(backup_path)
        except Exception:
            # If backup fails, keep serving the default payload so research can continue.
            return

    async def read_all(self) -> Dict[str, Any]:
        async with self._lock:
            return await self._read_unlocked()

    async def write_all(self, data: Dict[str, Any]) -> None:
        async with self._lock:
            await self._write_unlocked(data)
