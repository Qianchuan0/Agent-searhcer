# 🔍 agent Researcher MCP 服务器

> **注意：** 此内容已迁移至专用仓库：[https://github.com/assafelovic/gptr-mcp](https://github.com/assafelovic/gptr-mcp)

## 概述

agent Researcher MCP 服务器使 Claude 等 AI 助手能够通过机器对话协议（MCP）进行全面的 Web 研究并生成详细报告。

## 为什么选择 agent Researcher MCP？

虽然 LLM 应用可以通过 MCP 访问 Web 搜索工具，但 **agent Researcher MCP 能提供深度研究结果。** 标准搜索工具返回需要手动筛选的原始结果，通常包含不相关的来源，浪费上下文窗口空间。

agent Researcher 会自主探索并验证大量来源，仅关注相关、可信和最新的信息。虽然比标准搜索稍慢（约 30 秒等待），但它能提供：

* ✨ 更高质量的信息
* 📊 优化的上下文使用
* 🔎 全面的结果
* 🧠 为 LLM 提供更好的推理

## 特性

### 资源
* `research_resource`：通过研究获取与给定任务相关的 Web 资源。

### 主要工具
* `deep_research`：对某个主题进行深度 Web 研究，查找可靠且相关的信息
* `quick_search`：执行快速 Web 搜索，优先速度而非质量
* `write_report`：根据研究结果生成报告
* `get_research_sources`：获取研究中使用的来源
* `get_research_context`：获取研究的完整上下文

## 安装

详细的安装和使用说明，请访问[官方仓库](https://github.com/assafelovic/gptr-mcp)。

快速开始：

1. 克隆新仓库：
   ```bash
   git clone https://github.com/assafelovic/gptr-mcp.git
   cd gptr-mcp
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 创建 `.env` 文件并填入你的 API 密钥：
   ```
   OPENAI_API_KEY=your_openai_api_key
   TAVILY_API_KEY=your_tavily_api_key
   ```

4. 运行服务器：
   ```bash
   python server.py
   ```

如需 Docker 部署、Claude Desktop 集成、示例用法和故障排查，请参阅[完整文档](https://github.com/assafelovic/gptr-mcp)。

## 支持与联系

* 网站：[gptr.dev](https://gptr.dev)
* GitHub：[assafelovic/gptr-mcp](https://github.com/assafelovic/gptr-mcp) :-)
