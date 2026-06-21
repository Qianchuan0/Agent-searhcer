# 深度研究 ✨ 全新 ✨

随着 AI 社区最新的"深度研究"热潮，我们很高兴实现了自己的开源深度研究能力！隆重推出 agent Researcher 的深度研究——一个先进的递归研究系统，以前所未有的深度和广度探索主题。

## 工作原理

深度研究采用一种迷人的树状探索模式：

1. **广度（Breadth）**：在每一层生成多个搜索查询，探索主题的不同方面
2. **深度（Depth）**：对每个分支递归下钻，追踪线索、发现关联
3. **并发处理**：利用 async/await 模式同时运行多条研究路径
4. **智能上下文管理**：自动汇总并综合所有分支的发现
5. **进度追踪**：实时更新广度和深度维度上的研究进度

可以把它想象成部署了一支 AI 研究团队，每位成员沿各自的研究路径前进，同时协作构建对你主题的全面理解。

## 流程图
![deep research](https://github.com/user-attachments/assets/eba2d94b-bef3-4f8d-bbc0-f15bd0a40968)


## 快速开始

```python
from gpt_researcher import GPTResearcher
from gpt_researcher.utils.enum import ReportType, Tone
import asyncio

async def main():
    # 以深度研究类型初始化 researcher
    researcher = GPTResearcher(
        query="What are the latest developments in quantum computing?",
        report_type="deep",  # 触发深度研究模式
    )
    
    # 运行研究
    research_data = await researcher.conduct_research()
    
    # 生成报告
    report = await researcher.write_report()
    print(report)

if __name__ == "__main__":
    asyncio.run(main())
```

## 配置

深度研究的行为可通过以下几个参数自定义：

- `deep_research_breadth`：每一层的并行研究路径数量（默认：4）
- `deep_research_depth`：探索的层数（默认：2）
- `deep_research_concurrency`：并发研究操作的最大数量（默认：2）

你可以在配置文件中配置、作为环境变量传入，或直接传入：

```python
researcher = GPTResearcher(
    query="your query",
    report_type="deep",
    config_path="path/to/config.yaml"  # 在此配置深度研究参数
)
```

## 进度追踪

`on_progress` 回调可提供研究过程的实时洞察：

```python
class ResearchProgress:
    current_depth: int       # 当前深度层级
    total_depth: int         # 最大探索深度
    current_breadth: int     # 当前并行路径数
    total_breadth: int       # 每层的最大广度
    current_query: str       # 正在处理的查询
    completed_queries: int   # 已完成的查询数
    total_queries: int       # 待处理的总查询数
```

## 高级用法

### 自定义研究流程

```python
researcher = GPTResearcher(
    query="your query",
    report_type="deep",
    tone=Tone.Objective,
    headers={"User-Agent": "your-agent"},  # 网络请求的自定义 headers
    verbose=True  # 启用详细日志
)

# 获取原始研究上下文
context = await researcher.conduct_research()

# 访问研究来源
sources = researcher.get_research_sources()

# 获取访问过的 URL
urls = researcher.get_source_urls()

# 生成格式化报告
report = await researcher.write_report()
```

### 错误处理

深度研究系统具备韧性设计：

- 失败的查询会被自动跳过
- 即使部分分支失败，研究仍会继续
- 进度追踪有助于发现任何问题

## 最佳实践

1. **从宽到窄**：从一个宽泛的查询开始，让系统探索具体细节
2. **监控进度**：使用进度回调了解研究流向
3. **调整参数**：根据需求调整广度和深度：
   - 广度更大 = 覆盖更广
   - 深度更大 = 见解更深
4. **资源管理**：根据系统能力考虑并发上限

## 局限性

- 使用如 `o3-mini` 这类推理型 LLM 模型。这意味着需要推理权限，且整体运行会明显变慢。
- 深度研究可能比标准研究耗时更长
- 由于多个并发查询，API 用量和成本更高
- 并行处理可能需要更多系统资源

祝你研究愉快！🎉 
