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
    MemorySearchRequest,
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
            backup_files = list(Path(tmp).glob("memory.json.corrupt-*"))

            self.assertFalse(payload["settings"]["enabled"])
            self.assertEqual(payload["items"], {})
            self.assertEqual(len(backup_files), 1)
            self.assertFalse(store_path.exists())

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

    def test_report_store_preserves_adopted_memory_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            report_store = ReportStore(Path(tmp) / "reports.json")
            report = {
                "id": "report_meta",
                "question": "继续研究 AI IDE 市场",
                "answer": "最新报告正文",
                "orderedData": [],
                "chatMessages": [],
                "adopted_memory_ids": ["memory_1", "memory_2"],
                "adopted_memories_snapshot": [
                    {
                        "id": "memory_1",
                        "title": "旧结论 A",
                        "core_claim": "AI IDE 竞争正在转向工作流整合。",
                        "summary": "旧结论 A 摘要",
                        "reportId": "old-report",
                        "score": 0.91,
                        "confidence": "high",
                        "createdAt": "2026-06-23T00:00:00+00:00",
                        "staleness": "fresh",
                    }
                ],
                "timestamp": 1,
            }

            run(report_store.upsert_report("report_meta", report))
            saved = run(report_store.get_report("report_meta"))

            self.assertEqual(saved["adopted_memory_ids"], ["memory_1", "memory_2"])
            self.assertEqual(len(saved["adopted_memories_snapshot"]), 1)
            self.assertEqual(
                saved["adopted_memories_snapshot"][0]["core_claim"],
                "AI IDE 竞争正在转向工作流整合。",
            )

    def test_research_knowledge_suggestion_includes_core_claim(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            run(
                service._report_store.upsert_report(
                    "report_suggestion",
                    {
                        "id": "report_suggestion",
                        "question": "AI IDE 市场格局接下来会怎么演化？",
                        "answer": "AI IDE 正在从通用问答助手转向工作流整合平台竞争，差异点集中在工具链闭环与团队协作能力。",
                        "orderedData": [],
                        "chatMessages": [],
                        "timestamp": 1,
                    },
                )
            )

            response = run(
                service.generate_suggestions(MemorySuggestionRequest(report_id="report_suggestion"))
            )

            research_knowledge = next(
                suggestion for suggestion in response.suggestions if suggestion.type == "research_knowledge"
            )
            self.assertEqual(
                research_knowledge.core_claim,
                "AI IDE 正在从通用问答助手转向工作流整合平台竞争，差异点集中在工具链闭环与团队协作能力。"
            )
            self.assertTrue(research_knowledge.content)

    def test_report_memory_returns_selected_bridge_conclusions(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            saved = run(
                service.create_item(
                    MemoryCreateRequest(
                        type="research_knowledge",
                        title="旧结论 A",
                        core_claim="旧结论 A 指出 AI IDE 的竞争正在转向工作流整合。",
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
                                            "core_claim": saved.core_claim,
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
            self.assertEqual(report_memory.findings[0].claim, saved.core_claim)
            self.assertEqual(report_memory.metadata["adopted_memory_ids"], [saved.id])

    def test_search_prioritizes_primary_bridge_memories(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            run(
                service.create_item(
                    MemoryCreateRequest(
                        type="saved_context",
                        title="AI IDE 背景",
                        content="用户之前研究过 AI IDE 市场。",
                        summary="AI IDE 市场的背景上下文",
                        tags=["ai", "ide"],
                        source=MemorySource(
                            kind="report",
                            report_id="report-ctx",
                            created_from="memory_suggestion",
                        ),
                        confidence="high",
                    )
                )
            )

            primary = run(
                service.create_item(
                    MemoryCreateRequest(
                        type="research_knowledge",
                        title="AI IDE 市场格局",
                        core_claim="AI IDE 正在从通用助手走向工作流集成平台竞争。",
                        content="AI IDE 正在从通用助手走向工作流集成平台竞争，关键差异在工具链整合和团队协作。",
                        summary="市场竞争重点从单点能力转向工作流和协作整合。",
                        tags=["ai", "ide"],
                        source=MemorySource(
                            kind="report",
                            report_id="report-main",
                            created_from="memory_suggestion",
                        ),
                        confidence="high",
                    )
                )
            )

            response = run(service.search(MemorySearchRequest(query="AI IDE 市场", limit=5)))

            self.assertGreaterEqual(len(response.results), 2)
            self.assertEqual(response.results[0].item.id, primary.id)
            self.assertEqual(response.results[0].item.type, "research_knowledge")

    def test_search_keeps_fallback_memories_after_structured_primary_memories(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = self.create_service(Path(tmp))
            self.enable_memory(service)

            primary = run(
                service.create_item(
                    MemoryCreateRequest(
                        type="research_knowledge",
                        title="AI IDE 市场格局主结论",
                        core_claim="AI IDE 竞争正在从单点能力转向工作流整合。",
                        content="AI IDE 竞争正在从单点能力转向工作流整合，平台能力成为核心差异。",
                        summary="结构化主结论",
                        tags=["ai", "ide", "market"],
                        source=MemorySource(
                            kind="report",
                            report_id="primary-report",
                            created_from="memory_suggestion",
                        ),
                        confidence="high",
                    )
                )
            )

            payload = run(service._store.read_all())
            payload["items"]["legacy-memory"] = {
                "id": "legacy-memory",
                "scope": "local",
                "type": "research_knowledge",
                "title": "AI IDE 市场格局旧条目",
                "content": "AI IDE 市场格局 AI IDE 市场格局 AI IDE 市场格局",
                "summary": "旧数据缺少 core_claim，但仍与查询相关。",
                "tags": ["ai", "ide", "market", "legacy"],
                "source": {
                    "kind": "report",
                    "report_id": "legacy-report",
                    "created_from": "memory_suggestion",
                },
                "confidence": "high",
                "status": "active",
                "created_at": "2026-06-20T00:00:00+00:00",
                "updated_at": "2026-06-20T00:00:00+00:00",
                "last_used_at": None,
                "expires_at": None,
                "embedding_id": None,
            }
            run(service._store.write_all(payload))

            response = run(service.search(MemorySearchRequest(query="AI IDE 市场格局", limit=5)))

            ids = [result.item.id for result in response.results]
            self.assertIn(primary.id, ids)
            self.assertIn("legacy-memory", ids)
            self.assertLess(ids.index(primary.id), ids.index("legacy-memory"))
            legacy_result = next(result for result in response.results if result.item.id == "legacy-memory")
            self.assertIsNone(legacy_result.item.core_claim)

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
