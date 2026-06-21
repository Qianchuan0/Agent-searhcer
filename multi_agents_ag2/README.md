# AG2 x agent Researcher

[AG2](https://github.com/ag2ai/ag2) 是一个用于构建基于 LLM 的多 agent 应用的框架。
本示例使用 AG2 来编排 agent Researcher 的多 agent 工作流。

## 使用场景

本示例与 LangGraph 流程相对应，使用相同的 agent 集合和阶段，但以 AG2 作为编排层。

## 多 Agent 团队

研究团队由 8 个 agent 组成：
- **Human（人类）** - 流程中的人类，监督整个过程并向 agent 提供反馈。
- **Chief Editor（主编）** - 监督研究过程并管理团队。
- **Researcher（研究员，gpt-researcher）** - 专门对给定主题进行深度研究的自主 agent。
- **Editor（编辑）** - 负责规划研究大纲和结构。
- **Reviewer（审稿人）** - 根据一组标准验证研究结果的正确性。
- **Revisor（修订者）** - 根据审稿人的反馈修订研究结果。
- **Writer（撰稿人）** - 负责整理并撰写最终报告。
- **Publisher（发布者）** - 负责以多种格式发布最终报告。

## 工作原理

阶段：
1. 规划阶段
2. 数据收集与分析
3. 审阅与修订
4. 撰写与提交
5. 发布

## 如何运行

1. 安装依赖：
    ```bash
    pip install -r requirements.txt
    pip install -r multi_agents_ag2/requirements.txt
    ```
2. 配置环境变量：
    ```bash
    export OPENAI_API_KEY={在此填入你的 OpenAI API Key}
    export TAVILY_API_KEY={在此填入你的 Tavily API Key}
    ```
3. 运行应用：
    ```bash
    python -m multi_agents_ag2.main
    ```

## 使用方法

如需更改研究问题并自定义报告，请编辑 `multi_agents_ag2/task.json`。

### task.json 包含以下字段：
- `query` - 研究问题或任务。
- `model` - agent 使用的 OpenAI LLM。
- `max_sections` - 报告的最大章节数。每个章节是研究问题的一个子主题。
- `max_revisions` - 每个章节的审稿/修订循环最大次数。
- `include_human_feedback` - 为 true 时，用户可向 agent 提供反馈；为 false 时，agent 将自主工作。
- `publish_formats` - 发布报告的格式。报告将写入 `outputs` 目录。
- `source` - 进行研究的来源。选项：`web` 或 `local`。若为 local，请添加 `DOC_PATH` 环境变量。
- `follow_guidelines` - 为 true 时，研究报告将遵循以下准则，完成时间更长；为 false 时，报告生成更快但可能不遵循准则。
- `guidelines` - 报告必须遵循的准则列表。
- `verbose` - 为 true 时，应用将向控制台输出详细日志。
