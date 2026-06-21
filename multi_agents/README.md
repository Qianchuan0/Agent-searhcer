# LangGraph x agent Researcher

[LangGraph](https://python.langchain.com/docs/langgraph) 是一个用于构建有状态、多角色 LLM 应用的库。
本示例使用 Langgraph 自动完成对任意主题的深度研究流程。

需要 AG2 版本？请查看 `multi_agents_ag2/` 和 AG2 文档页面。

## 使用场景

通过 Langgraph，借助多个具备专业技能的 agent，可以显著提升研究流程的深度与质量。
受最新 [STORM](https://arxiv.org/abs/2402.14207) 论文启发，本示例展示了一组 AI agent 如何协同完成从规划到发布的研究工作。

一次运行平均可生成 5-6 页的研究报告，支持 PDF、Docx、Markdown 等多种格式。

请注意：多 agent 与 GPT-Researcher 使用相同的模型配置，但目前仅使用 SMART_LLM。详情请参阅 [LLM 配置文档](https://docs.gptr.dev/docs/gpt-researcher/llms)。

## 多 Agent 团队

研究团队由 8 个 agent 组成：
- **Human（人类）** - 流程中的人类，监督整个过程并向 agent 提供反馈。
- **Chief Editor（主编）** - 监督研究过程并管理团队。这是使用 Langgraph 协调其他 agent 的"主"agent。
- **Researcher（研究员，gpt-researcher）** - 专门对给定主题进行深度研究的自主 agent。
- **Editor（编辑）** - 负责规划研究大纲和结构。
- **Reviewer（审稿人）** - 根据一组标准验证研究结果的正确性。
- **Revisor（修订者）** - 根据审稿人的反馈修订研究结果。
- **Writer（撰稿人）** - 负责整理并撰写最终报告。
- **Publisher（发布者）** - 负责以多种格式发布最终报告。

## 工作原理

总体而言，流程基于以下阶段：
1. 规划阶段
2. 数据收集与分析
3. 审阅与修订
4. 撰写与提交
5. 发布

### 架构
<div align="center">
<img align="center" height="600" src="https://github.com/user-attachments/assets/ef561295-05f4-40a8-a57d-8178be687b18">
</div>
<br clear="all"/>

### 步骤

更具体地（如架构图所示），流程如下：
- Browser（浏览器，gpt-researcher）- 根据给定研究任务浏览互联网进行初始研究。
- Editor（编辑）- 基于初始研究规划报告大纲和结构。
- 对大纲中的每个主题（并行执行）：
  - Researcher（研究员，gpt-researcher）- 对子主题进行深度研究并撰写草稿。
  - Reviewer（审稿人）- 根据标准验证草稿正确性并提供反馈。
  - Revisor（修订者）- 根据审稿人反馈修订草稿，直到满意为止。
- Writer（撰稿人）- 根据研究结果整理并撰写最终报告，包含引言、结论和参考文献部分。
- Publisher（发布者）- 将最终报告发布为 PDF、Docx、Markdown 等多种格式。

## 如何运行

1. 安装根目录下所需的依赖包（含 `langgraph`）：
    ```bash
    pip install -r requirements.txt
    ```
3. 配置环境变量，详情请参阅 [GPT-Researcher 文档](https://docs.gptr.dev/docs/gpt-researcher/llms)。

2. 运行应用：
    ```bash
    python main.py
    ```

## 使用方法

如需更改研究问题并自定义报告，请编辑主目录下的 `task.json` 文件。

#### task.json 包含以下字段：
- `query` - 研究问题或任务。
- `model` - agent 使用的 OpenAI LLM。
- `max_sections` - 报告的最大章节数。每个章节是研究问题的一个子主题。
- `max_plan_revisions` - 在工作流以明确错误退出前，人工请求的规划修订最大次数。设为 `null` 则依赖 LangGraph 的递归限制。
- `include_human_feedback` - 为 true 时，用户可向 agent 提供反馈；为 false 时，agent 将自主工作。
- `publish_formats` - 发布报告的格式。报告将写入 `output` 目录。
- `source` - 进行研究的来源。选项：`web` 或 `local`。若为 local，请添加 `DOC_PATH` 环境变量。
- `follow_guidelines` - 为 true 时，研究报告将遵循以下准则，完成时间更长；为 false 时，报告生成更快但可能不遵循准则。
- `guidelines` - 报告必须遵循的准则列表。
- `verbose` - 为 true 时，应用将向控制台输出详细日志。

#### 示例：
```json
{
  "query": "Is AI in a hype cycle?",
  "model": "gpt-4o",
  "max_sections": 3,
  "max_plan_revisions": 3,
  "publish_formats": { 
    "markdown": true,
    "pdf": true,
    "docx": true
  },
  "include_human_feedback": false,
  "source": "web",
  "follow_guidelines": true,
  "guidelines": [
    "The report MUST fully answer the original question",
    "The report MUST be written in apa format",
    "The report MUST be written in english"
  ],
  "verbose": true
}
```

## 部署

```shell
pip install langgraph-cli
langgraph up
```

随后请参阅[此文档](https://github.com/langchain-ai/langgraph-example)，了解如何使用流式与异步端点，以及 playground。
