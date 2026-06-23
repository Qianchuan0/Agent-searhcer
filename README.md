# agent Researcher

基于 [gpt-researcher](https://github.com/assafelovic/gpt-researcher) 的深度定制版，核心扩展了**长期记忆系统**、**研究报告承接**和**重构后的 Next.js 前端**，并把 LLM/Embedding 默认接入 DeepSeek 生态，对中文查询做了分词与语义检索优化。

版本：`0.14.7`（继承自上游）

---

## 与上游 gpt-researcher 的差异

| 维度 | 上游 | 本定制版 |
|---|---|---|
| 长期记忆 | 无 | 完整记忆系统（CRUD + 双层检索 + 报告承接） |
| 前端 | HTML/CSS/JS 单页 | Next.js 14 App Router，三栏暗色玻璃拟态 |
| 报告承接 | 无 | `adopted_memories_snapshot` 持久化，前端 `ResearchMemoryBridge` |
| 中文检索 | 整句当单 token，命中率低 | jieba 分词 + tags 词典注入 + Qwen3 语义召回 |
| LLM/Embedding | OpenAI 默认 | DeepSeek（OpenAI 兼容）+ Qwen3-Embedding |
| 记忆 MCP | 无 | `/api/memory/mcp-capabilities` 对接 MCP 客户端 |

---

## 核心特性

- **长期记忆系统**：研究结论自动归档为 `MemoryItem`，下次研究时按"当前报告建议集"召回，避免重复劳动
- **词法 + 语义双层检索**：jieba 分词（含 tags 词典注入）做词法召回；Qwen3 embedding cosine 做语义召回；词法漏掉的近义改写靠 cosine 兜底
- **报告承接**：新研究可勾选历史结论作为上下文，承接快照随报告持久化
- **研究关系分类**：`classify-research` 自动判定 `new_topic / follow_up / refresh / compare`，给不同的研究策略建议
- **前端重构**：Next.js 14 + WebSocket 实时进度 + 多代理可视化 + 记忆管理面板
- **降级安全**：无 API key / 无网络时，记忆系统自动降级到纯词法，功能不中断（单测在无 key 环境跑通）

---

## 架构

```
┌─────────────────────────────────────────────────────────┐
│  Frontend  (frontend/nextjs, Next.js 14, port 3000)     │
│  ├─ app/                App Router 页面                  │
│  ├─ components/research/  ResearchMemoryBridge           │
│  │                       MemorySuggestionPanel          │
│  └─ components/shell/    MemoryManager                   │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket /ws + REST /api/*
┌──────────────────────▼──────────────────────────────────┐
│  Backend   (backend/server, FastAPI, port 8000)          │
│  ├─ app.py              路由（报告/记忆/聊天/多代理）       │
│  ├─ memory_service.py   记忆检索（词法+语义融合）          │
│  ├─ memory_embeddings.py Embedding 缓存 + cosine          │
│  ├─ memory_store.py     原子 JSON 存储                    │
│  ├─ memory_mcp_adapter.py MCP 工具适配                    │
│  └─ report_store.py     报告 + adopted_memories_snapshot │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Core      (gpt_researcher/, 上游核心)                   │
│  计划者/执行代理 + RAG + 多检索器                          │
└─────────────────────────────────────────────────────────┘
```

**数据流**：前端 WebSocket 发研究请求 → backend 调用 gpt_researcher 核心 → 爬虫检索 + LLM 聚合 → 报告落 `data/reports.json`，结论归档到 `data/memory/memory.json`，向量缓存到 `data/memory/embeddings.pkl`。

---

## 快速开始

### 环境要求

- Python ≥ 3.11
- Node.js ≥ 18
- 一个 LLM API key（默认 DeepSeek，也支持任何 OpenAI 兼容端点）
- 一个搜索 API key（默认 Tavily）

### 步骤 1：配置 `.env`

复制 `.env.example` 为 `.env`，填入：

```bash
# LLM（默认走 DeepSeek 的 OpenAI 兼容接口）
OPENAI_API_KEY=你的_deepseek_key
OPENAI_BASE_URL=https://api.deepseek.com
FAST_LLM=openai:deepseek-v4-flash
SMART_LLM=openai:deepseek-v4-pro
STRATEGIC_LLM=openai:deepseek-v4-pro

# Embedding（格式 provider:model，复用上面的 key）
EMBEDDING=openai:Qwen/Qwen3-Embedding-0.6B

# 搜索引擎
TAVILY_API_KEY=你的_tavily_key
```

> 不指定 `EMBEDDING` 时记忆系统会自动降级为纯词法检索，功能不中断但召回率降低。

### 步骤 2：安装依赖

```bash
# 后端
pip install -r requirements.txt

# 前端
cd frontend/nextjs
npm install
cd ..
```

### 步骤 3：启动

```bash
# 终端 1：后端（端口 8000）
python main.py
# 或：uvicorn main:app --reload

# 终端 2：前端（端口 3000）
cd frontend/nextjs
npm run dev
```

浏览器访问 `http://localhost:3000`，前端通过 `NEXT_PUBLIC_GPTR_API_URL` 连后端（默认 `localhost:8000`）。

---

## 记忆系统

### 数据模型

每条 `MemoryItem`（`backend/server/memory_schemas.py`）字段：

| 字段 | 说明 |
|---|---|
| `type` | `research_knowledge` / `report_index` / `saved_context` / `research_interest` / `user_preference` |
| `title` / `core_claim` / `summary` | 三段式内容，`core_claim` 是一句话主结论 |
| `tags` | 自动从问题/答案抽取，也用于 jieba 词典注入 |
| `status` | `active` / `disabled` / `deleted` |
| `embedding_id` | 模型版本戳，换模型时据此重算向量 |
| `source.report_id` | 来源报告 |

### 检索机制（`memory_service.py:search`）

1. **jieba 分词 + tags 词典注入**：把记忆的 tags 动态加进 jieba 词典，避免"赛博朋克"这类术语被切散
2. **词法召回**：token 子串匹配，打分含类型/置信度 bonus
3. **语义召回**：query 向量与记忆向量做 cosine，阈值 `0.35` 以上才召回（`SEMANTIC_RECALL_THRESHOLD`）
4. **融合**：词法命中的保持原量纲分；纯语义召回的映射到 `[0.27, 0.6]` 区间（`SEMANTIC_RECALL_SCORE`）
5. **排序**：`(bridge_bucket, -score, -cosine, -core_claim, -created)`

**降级**：`_get_embedder()` 失败（无 key / 无网络 / provider 异常）→ 全程走纯词法 + jieba，不报错。

### 报告承接

研究新主题时，前端 `ResearchMemoryBridge` 卡片展示历史相关记忆，用户勾选后：
- 选中的记忆写入报告的 `adopted_memories_snapshot`
- `get_report_memory(report_id)` 读回承接结论 + 新结论
- 下次同主题研究时作为上下文复用

### 向量缓存

- 路径：`data/memory/embeddings.pkl`（与 `memory.json` 同目录）
- 写入：`.tmp + replace` 原子写（仿 `memory_store`）
- 冷启动：首次 search 时批量 `embed_documents` 回填所有 active 记忆
- 模型变更：换 `EMBEDDING` 后，`embedding_id` 比对不一致自动重算

---

## API 参考

主要端点（前缀 `/api`）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/PUT | `/memory/settings` | 记忆开关 |
| GET/POST/DELETE | `/memory/items` | 记忆 CRUD |
| POST | `/memory/search` | 双层检索 |
| POST | `/memory/suggestions` | 基于报告生成记忆建议 |
| POST | `/memory/classify-research` | 研究关系分类 |
| GET | `/memory/mcp-capabilities` | MCP 工具列表 |
| GET/POST/PUT/DELETE | `/reports` | 报告 CRUD |
| GET | `/reports/{id}/memory` | 报告承接的记忆 |
| POST | `/reports/{id}/chat` | 报告上下文聊天 |
| WS | `/ws` | 研究进度流 |
| POST | `/multi_agents` | 多代理任务 |

---

## 配置参考

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `OPENAI_API_KEY` | — | LLM + Embedding 的 key（DeepSeek 等） |
| `OPENAI_BASE_URL` | — | OpenAI 兼容端点 |
| `FAST_LLM` / `SMART_LLM` / `STRATEGIC_LLM` | — | 三档 LLM，格式 `provider:model` |
| `EMBEDDING` | `openai:text-embedding-3-small` | 记忆系统 embedding，格式 `provider:model` |
| `TAVILY_API_KEY` | — | 默认搜索引擎 |
| `MEMORY_STORE_PATH` | `data/memory/memory.json` | 记忆存储路径 |
| `DOC_PATH` | `./my-docs` | 本地文档检索路径 |
| `LANGCHAIN_TRACING_V2` | false | LangSmith 链路追踪 |

---

## 开发

```bash
# 跑记忆系统单测（无 key 也能跑，验证词法+jieba 层）
python -m unittest tests.test_memory_system

# 前端类型检查
cd frontend/nextjs && npm run lint
```

记忆系统设计文档：`docs/long-term-memory-acceptance-checklist.md`、`docs/manual-regression-2026-06-23.md`。

---

## 致敬与许可

本项目基于 [gpt-researcher](https://github.com/assafelovic/gpt-researcher)（MIT License），感谢上游作者 Assaf Elovic 及社区贡献者。本定制版同样采用 MIT License，保留上游 `LICENSE` 与 `citation.cff`。
