# agent Researcher MCP 集成

本目录包含 agent Researcher 的 Model Context Protocol (MCP) 完整集成。MCP 使 agent Researcher 能够通过标准化协议无缝连接并使用外部工具和数据源。

## 🔧 什么是 MCP？

Model Context Protocol (MCP) 是一个开放标准，支持 AI 应用与外部数据源和工具之间的安全连接。借助 MCP，agent Researcher 可以：

- **访问本地数据**：连接数据库、文件系统和本地 API
- **使用外部工具**：集成 Web 服务、API 和第三方工具
- **扩展能力**：通过 MCP 服务器添加自定义功能
- **保障安全**：通过适当的身份验证和权限进行受控访问

## 📁 模块结构

```
gpt_researcher/mcp/
├── __init__.py           # 模块初始化与导入
├── client.py             # MCP 客户端管理与配置
├── tool_selector.py      # 使用 LLM 的智能工具选择
├── research.py           # 使用所选工具执行研究
├── streaming.py          # WebSocket 流式传输与日志工具
└── README.md            # 本文档
```

### 核心组件

#### 🤖 `client.py` - MCPClientManager
处理 MCP 服务器连接和客户端生命周期：
- 将 agent Researcher 配置转换为 MCP 格式
- 管理 MultiServerMCPClient 实例
- 处理连接类型（stdio、websocket、HTTP）
- 提供自动清理和资源管理

#### 🧠 `tool_selector.py` - MCPToolSelector
使用 LLM 分析的智能工具选择：
- 根据研究查询分析可用工具
- 使用 strategic LLM 进行最优工具选择
- 提供基于模式匹配的回退选择
- 限制工具选择数量以避免开销

#### 🔍 `research.py` - MCPResearchSkill
使用所选 MCP 工具执行研究：
- 将工具绑定到 LLM 以实现智能调用
- 管理工具执行和错误处理
- 将结果处理为标准格式
- 在工具结果旁附带 LLM 分析

#### 📡 `streaming.py` - MCPStreamer
实时流式传输和日志记录：
- 用于实时更新的 WebSocket 流式传输
- 用于调试的结构化日志
- 进度追踪和状态更新
- 错误和警告管理

## 🚀 快速开始

### 前置条件

1. **安装 MCP 依赖**：
   ```bash
   pip install langchain-mcp-adapters
   ```

2. **设置 MCP 服务器**：你需要至少一个可连接的 MCP 服务器。可以是：
   - 你自己开发的本地服务器
   - 第三方 MCP 服务器
   - 基于云的 MCP 服务

### 基本用法

#### 1. 在 agent Researcher 中配置 MCP

```python
from gpt_researcher import GPTResearcher

# 本地服务器的 MCP 配置
mcp_configs = [{
    "command": "python",
    "args": ["my_mcp_server.py"],
    "name": "local_server",
    "tool_name": "search"  # 可选：指定具体工具
}]

# 使用 MCP 初始化 researcher
researcher = GPTResearcher(
    query="What are the latest developments in AI?",
    mcp_configs=mcp_configs
)

# 使用 MCP 工具进行研究
context = await researcher.conduct_research()
report = await researcher.write_report()
```

#### 2. WebSocket/HTTP 服务器配置

```python
# WebSocket MCP 服务器
mcp_configs = [{
    "connection_url": "ws://localhost:8080/mcp",
    "connection_type": "websocket",
    "name": "websocket_server"
}]

# HTTP MCP 服务器
mcp_configs = [{
    "connection_url": "https://api.example.com/mcp",
    "connection_type": "http",
    "connection_token": "your-auth-token",
    "name": "http_server"
}]
```

#### 3. 多服务器

```python
mcp_configs = [
    {
        "command": "python",
        "args": ["database_server.py"],
        "name": "database",
        "env": {"DB_HOST": "localhost"}
    },
    {
        "connection_url": "ws://localhost:8080/search",
        "name": "search_service"
    },
    {
        "connection_url": "https://api.knowledge.com/mcp",
        "connection_token": "token123",
        "name": "knowledge_base"
    }
]
```

## 🔧 配置选项

### MCP 服务器配置

每个 MCP 服务器配置支持以下选项：

| 字段              | 类型 | 说明 | 示例 |
|--------------------|------|-------------|---------|
| `name`             | `str` | 服务器唯一名称 | `"my_server"` |
| `command`          | `str` | 启动 stdio 服务器的命令 | `"python"` |
| `args`             | `list[str]` | 命令参数 | `["server.py", "--port", "8080"]` |
| `connection_url`   | `str` | websocket/HTTP 连接的 URL | `"ws://localhost:8080/mcp"` |
| `connection_type`  | `str` | 连接类型 | `"stdio"`、`"websocket"`、`"http"` |
| `connection_token` | `str` | 身份验证令牌 | `"your-token"` |
| `tool_name`        | `str` | 要使用的具体工具（可选） | `"search"` |
| `env`              | `dict` | 环境变量 | `{"API_KEY": "secret"}` |

### 自动检测功能

MCP 客户端会自动检测连接类型：
- 以 `ws://` 或 `wss://` 开头的 URL → WebSocket
- 以 `http://` 或 `https://` 开头的 URL → HTTP  
- 未提供 URL → stdio（默认）

## 🏗️ 开发

### 添加新组件

1. 在相应文件中**创建你的组件**
2. 将其**添加到 `__init__.py`** 以便导入
3. **更新此 README** 的文档
4. 在 tests 目录中**添加测试**

### 扩展工具选择

如需自定义工具选择逻辑，请扩展 `MCPToolSelector`：

```python
from gpt_researcher.mcp import MCPToolSelector

class CustomToolSelector(MCPToolSelector):
    def _fallback_tool_selection(self, all_tools, max_tools):
        # 自定义回退逻辑
        return super()._fallback_tool_selection(all_tools, max_tools)
```

### 自定义结果处理

扩展 `MCPResearchSkill` 以实现自定义结果处理：

```python
from gpt_researcher.mcp import MCPResearchSkill

class CustomResearchSkill(MCPResearchSkill):
    def _process_tool_result(self, tool_name, result):
        # 自定义结果处理
        return super()._process_tool_result(tool_name, result)
```

## 🔒 安全注意事项

- **令牌管理**：安全地存储身份验证令牌
- **服务器验证**：仅连接受信任的 MCP 服务器
- **环境变量**：对敏感配置使用环境变量
- **网络安全**：远程连接使用 HTTPS/WSS
- **访问控制**：实施适当的权限控制

## 🐛 故障排查

### 常见问题

1. **导入错误**：`langchain-mcp-adapters not installed`
   ```bash
   pip install langchain-mcp-adapters
   ```

2. **连接失败**：检查服务器 URL 和身份验证
   - 确认服务器正在运行
   - 检查连接 URL 格式
   - 验证身份验证令牌

3. **无可用工具**：服务器可能未暴露工具
   - 检查服务器实现
   - 验证工具注册
   - 查看服务器日志

4. **工具选择问题**：LLM 可能未选择合适的工具
   - 审查工具描述
   - 检查查询相关性
   - 考虑自定义选择逻辑

### 调试日志

启用调试日志以获取详细信息：

```python
import logging
logging.getLogger('gpt_researcher.mcp').setLevel(logging.DEBUG)
```

## 📚 资源

- **MCP 规范**：[Model Context Protocol 文档](https://spec.modelcontextprotocol.io/)
- **langchain-mcp-adapters**：[GitHub 仓库](https://github.com/modelcontextprotocol/langchain-mcp-adapters)
- **agent Researcher 文档**：[文档站](https://docs.gptr.dev/)
- **示例 MCP 服务器**：[MCP 示例](https://github.com/modelcontextprotocol/servers)

## 🤝 贡献

欢迎对 MCP 集成贡献代码！请：

1. **遵循上述项目结构**
2. **为新功能添加全面的测试**
3. **更新文档**（包括此 README）
4. **遵循与项目一致的编码规范**
5. **进行更改时考虑向后兼容性**

---

*此 MCP 集成为 agent Researcher 带来了强大的可扩展性，使其能够通过标准化的 MCP 协议连接几乎任何数据源或工具。* 🙂
