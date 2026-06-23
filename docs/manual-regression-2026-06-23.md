# 长期记忆端到端回归记录（2026-06-23）

## 环境

- 工作区：`D:\AiProgram\gpt-researcher`
- 当前日期：`2026-06-23`
- 前端：`http://127.0.0.1:3000`
- 主后端：`http://127.0.0.1:8000`
- 隔离回归后端：`http://127.0.0.1:8010`
- 隔离数据文件：
  - `D:\AiProgram\gpt-researcher\logs\manual-regression-sandbox\memory.json`
  - `D:\AiProgram\gpt-researcher\logs\manual-regression-sandbox\reports.json`

## 启动验证

- `GET http://127.0.0.1:3000` 返回 `200`
- `GET http://127.0.0.1:3000/research/test-page` 返回 `200`
- `GET http://127.0.0.1:8010/api/memory/settings` 返回 `200`

## 真实回归结果

### 已实际跑通

- `A1 / B1`：开启长期记忆后，通过 `POST /api/reports` 保存报告，自动生成 `report_index`，后续 `GET /api/reports/{id}/memory` 能返回新 findings。
- `A2`：报告保存时写入 `adopted_memory_ids` 和 `adopted_memories_snapshot`，随后 `GET /api/reports/{id}` 可读回。
- `A3 / D3 / 8.1`：在隔离 `memory.json` 中注入缺少 `core_claim` 的旧版 `research_knowledge`，检索仍会返回该条目，但排序落后于正式结构化主条目。
- `B2 / 7.1`：`POST /api/memory/suggestions` 对正常报告会返回 `research_knowledge` 建议，且带 `core_claim`。
- `C1`：同一查询下，`research_knowledge` 主承接条目排序在 fallback 旧条目前。
- `C2`：`user_preference` 不进入承接检索结果。
- `C3 / 3.2`：分类结果稳定返回 `relation`、`reason`、`suggested_strategy`。
- `G2 / 7.2`：对包含 `api_key=` 的报告请求建议时，返回 `blocked=true`、无建议项，并带明确阻断原因。
- `H1 / 8.2`：把隔离 `memory.json` 改成非法 JSON 后，接口仍能正常返回默认设置，不会阻断应用主流程。
- `H1 / 8.2`：损坏文件会被转存为 `memory.json.corrupt-*` 备份文件。
- `H2`：当前长期记忆回归链路未发现独立 `embeddings.json` 依赖，损坏恢复范围仅覆盖 `memory.json`。

### 关键实测数据

- 正常检索顺序：
  - 第 1 条：结构化 `research_knowledge`
  - 第 2 条：`saved_context`
  - 第 3 条：缺少 `core_claim` 的 fallback 旧条目
- 正常建议生成：
  - 建议数：`2`
  - `research_knowledge` 建议含 `core_claim`：`true`
- 敏感阻断：
  - `blocked`：`true`
  - `suggestion_count`：`0`
  - `reason`：`检测到疑似敏感信息，本次不会生成长期记忆建议。`
- 损坏恢复：
  - 已生成备份：`memory.json.corrupt-*`
  - 接口仍返回默认 settings：`enabled=false`

## 分项结论

- `通过`：
  - `A1 A2 A3`
  - `B1 B2`
  - `C1 C2 C3`
  - `G2`
  - `H1 H2`
- `部分通过（已做接口闭环与代码路径核对，未做浏览器点击回归）`：
  - `D1 D2 D4`
  - `E1 E2 E3`
  - `F1 F2 F3`

## 部分通过说明

- 当前工具链里没有可直接操作本地浏览器页面的现成能力，因此这次端到端回归对 UI 相关项主要做了两层验证：
  - 前后端真实启动，页面路由可访问
  - 后端真实接口、持久化文件、前端接线代码路径一致
- 未完成的不是功能实现，而是“人工点页面”的最终视觉确认：
  - 承接弹层默认展示与默认勾选
  - 研究启动时的结构化历史注入
  - 报告页顶部区块的最终页面呈现

## 本次使用的核心验证命令

```bash
python -m unittest tests.test_memory_system
python -m py_compile backend/server/memory_service.py backend/server/memory_schemas.py backend/server/report_store.py backend/server/memory_store.py
npx tsc --noEmit
```

## 建议的下一步

- 如果要把 `D / E / F` 三组也从“部分通过”提升到“完全通过”，下一步应补一个本地浏览器自动化回归脚本，覆盖：
  - 承接弹层展示与勾选
  - 报告页历史引用区块
  - 敏感阻断页面内提示
