import asyncio
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from server.memory_mcp_adapter import MemoryMCPAdapter
from server.memory_schemas import (
    MemoryCreateRequest,
    MemorySettingsUpdateRequest,
    MemorySource,
    MemorySuggestionRequest,
)
from server.memory_service import MemoryService
from server.memory_store import MemoryStore
from server.report_store import ReportStore


def run(coro):
    return asyncio.run(coro)


class MemorySystemTests(unittest.TestCase):
    def create_service(self, root: Path) -> MemoryService:
        memory_store = MemoryStore(root / "memory.json")
        report_store = ReportStore(root / "reports.json")
        return MemoryService(memory_store, report_store)

    def enable_memory(self, service: MemoryService):
        run(service.update_settings(MemorySettingsUpdateRequest(enabled=True)))

    def test_memory_store_recovers_from_corrupted_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            store_path = Path(tmp) / "memory.json"
            store_path.write_text("{not-valid-json", encoding="utf-8")

            store = MemoryStore(store_path)
            payload = run(store.read_all())

            self.assertFalse(payload["settings"]["enabled"])
            self.assertEqual(payload["items"], {})

            payload["settings"]["enabled"] = True
            run(store.write_all(payload))

            repaired = json.loads(store_path.read_text(encoding="utf-8"))
            self.assertTrue(repaired["settings"]["enabled"])
            self.assertEqual(repaired["items"], {})

    def test_sensitive_report_blocks_suggestions(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            run(
                service._report_store.upsert_report(
                    "report_sensitive",
                    {
                        "id": "report_sensitive",
                        "question": "整理这段配置",
                        "answer": "api_key=secret-value-123456",
                        "orderedData": [],
                        "chatMessages": [],
                        "timestamp": 1,
                    },
                )
            )

            response = run(
                service.generate_suggestions(MemorySuggestionRequest(report_id="report_sensitive"))
            )

            self.assertEqual(response.suggestions, [])
            self.assertTrue(response.metadata["blocked"])

    def test_report_memory_returns_selected_bridge_conclusions(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            saved = run(
                service.create_item(
                    MemoryCreateRequest(
                        type="research_knowledge",
                        title="旧结论 A",
                        content="旧结论 A 的详细内容",
                        summary="旧结论 A 摘要",
                        tags=["ai"],
                        source=MemorySource(
                            kind="report",
                            report_id="old-report",
                            created_from="memory_suggestion",
                        ),
                        confidence="high",
                    )
                )
            )

            run(
                service._report_store.upsert_report(
                    "report_new",
                    {
                        "id": "report_new",
                        "question": "继续研究",
                        "answer": "新报告正文",
                        "orderedData": [
                            {
                                "type": "logs",
                                "content": "planning_research",
                                "output": "已承接 1 条历史结论",
                                "metadata": {
                                    "stage": "memory_bridge_confirmed",
                                    "selected_memories": [
                                        {
                                            "id": saved.id,
                                            "title": saved.title,
                                            "summary": saved.summary,
                                            "reportId": "old-report",
                                            "score": 0.92,
                                            "confidence": "high",
                                            "createdAt": saved.created_at.isoformat(),
                                            "staleness": "fresh",
                                        }
                                    ],
                                },
                            }
                        ],
                        "chatMessages": [],
                        "timestamp": 2,
                    },
                )
            )

            report_memory = run(service.get_report_memory("report_new"))

            self.assertEqual(len(report_memory.findings), 1)
            self.assertEqual(report_memory.findings[0].source_report_id, "old-report")
            self.assertEqual(report_memory.metadata["adopted_memory_ids"], [saved.id])

    def test_mcp_adapter_exposes_expected_capabilities(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            adapter = MemoryMCPAdapter(service)

            capabilities = adapter.capabilities()
            tool_names = [tool["name"] for tool in capabilities["tools"]]

            self.assertEqual(
                tool_names,
                [
                    "memory.search",
                    "memory.list",
                    "memory.save",
                    "memory.delete",
                ],
            )


if __name__ == "__main__":
    unittest.main()
