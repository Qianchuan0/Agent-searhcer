# GPT-Researcher 评测

本目录包含评估 GPT-Researcher 在不同研究任务中性能的评测工具和框架。

## 简单评测（`simple_evals/`）

`simple_evals` 目录包含一个简洁的评测框架，改编自 [OpenAI 的 simple-evals 系统](https://github.com/openai/simple-evals)，专门用于衡量大语言模型的短篇事实性。我们的实现基于 OpenAI 的 [SimpleQA 评测方法](https://github.com/openai/simple-evals/blob/main/simpleqa_eval.py)，遵循其零样本、思维链方法，并针对 GPT-Researcher 的特定使用场景进行了调整。

### 组件

- `simpleqa_eval.py`：对研究响应进行评分的核心评测逻辑
- `run_eval.py`：对 GPT-Researcher 执行评测的脚本
- `requirements.txt`：运行评测所需的依赖

### 测试数据集

`problems/` 目录包含评测数据集：

- `Simple QA Test Set.csv`：一组全面的事实性问题及其正确答案的集合，镜像自 OpenAI 的原始测试集。该数据集作为评估 GPT-Researcher 查找和报告准确信息能力的真值（ground truth）。此文件在本地维护，以确保评测基准一致，并防止上游的任何潜在变更影响我们的测试方法。

### 评测日志

`logs/` 目录包含保留在版本控制中的详细评测运行历史：

- 格式：`SimpleQA Eval {num_problems} Problems {date}.txt`
- 示例：`SimpleQA Eval 100 Problems 2-22-25.txt`

这些日志提供历史性能数据，对以下方面至关重要：
- 追踪随时间的性能改进
- 调试评测问题
- 比较不同版本的结果
- 保持评测过程的透明度

**注意：** 与典型的日志目录不同，此文件夹及其内容被有意纳入 git 跟踪，以维护评测运行的历史记录。

### 特性

- 衡量研究响应的事实准确性
- 使用 GPT-4 作为评分模型（可配置）
  ```python
  # 在 run_eval.py 中，你可以自定义评分模型：
  grader_model = ChatOpenAI(
      temperature=0,                           # 较低温度以获得更一致的评分
      model_name="gpt-4-turbo",               # 可更改为其他 OpenAI 模型
      openai_api_key=os.getenv("OPENAI_API_KEY")
  )
  ```
- 按三点量表对响应评分：
  - `CORRECT`（正确）：答案完整包含重要信息且无矛盾
  - `INCORRECT`（错误）：答案包含事实矛盾
  - `NOT_ATTEMPTED`（未作答）：答案既未确认也未反驳目标

**关于评分器配置的说明：** 默认评分器使用 GPT-4-turbo，但你可以修改模型及其参数以使用不同的 OpenAI 模型，或调整温度以获得不同的评分行为。这与 researcher 的配置相互独立，允许你根据需要优化成本或性能。

### 跟踪的指标

- 准确率
- F1 分数
- 每次查询的成本
- 成功/失败率
- 答案尝试率
- 来源覆盖率

### 运行评测

1. 安装依赖：
```bash
cd evals/simple_evals
pip install -r requirements.txt
```

2. 在 `.env` 文件中配置环境变量：
```bash
# 使用根目录的 .env 文件
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
LANGCHAIN_API_KEY=your_langchain_key_here
```

3. 运行评测：
```bash
python run_eval.py --num_examples <number>
```

`num_examples` 参数决定要评估多少个随机测试查询（默认：1）。

#### 自定义 Researcher 行为

评测使用默认设置的 GPTResearcher，但你可以修改 `run_eval.py` 以自定义 researcher 的行为：

```python
researcher = GPTResearcher(
    query=query,
    report_type=ReportType.ResearchReport.value,  # 要生成的报告类型
    report_format="markdown",                      # 输出格式
    report_source=ReportSource.Web.value,         # 研究来源
    tone=Tone.Objective,                          # 写作语气
    verbose=True                                  # 启用详细日志
)
```

可以调整这些参数以评估不同的研究配置或输出格式。完整配置选项列表请参见[配置文档](https://docs.gptr.dev/docs/gpt-researcher/gptr/config)。

**关于配置独立性的说明：** 评测系统设计为与 researcher 的配置相互独立。这意味着你可以为评测和研究使用不同的 LLM 和设置。例如：
- 评测可使用 GPT-4-turbo 评分，而 researcher 使用 Claude 3.5 Sonnet 进行研究
- 可使用不同的检索器、嵌入或报告格式
- token 限制和其他参数可单独自定义

这种分离允许对不同 researcher 配置进行无偏评测。但请注意，此功能目前处于实验阶段，需要进一步测试。

### 输出

评测提供详细指标，包括：
- 每个查询的结果（含来源和成本）
- 汇总指标（准确率、F1 分数）
- 总成本和平均成本
- 成功/失败计数
- 详细的评分明细

### 输出示例
```
=== Evaluation Summary ===
=== AGGREGATE METRICS ===

Debug counts:
Total successful: 100
CORRECT: 92
INCORRECT: 7
NOT_ATTEMPTED: 1
{
  "correct_rate": 0.92,
  "incorrect_rate": 0.07,
  "not_attempted_rate": 0.01,
  "answer_rate": 0.99,
  "accuracy": 0.9292929292929293,
  "f1": 0.9246231155778895
}
========================
Accuracy: 0.929
F1 Score: 0.925

Total cost: $1.2345
Average cost per query: $0.1371
``` 

## 幻觉评测（`hallucination_eval/`）

`hallucination_eval` 目录包含用于评估 GPT-Researcher 输出是否存在幻觉的工具。该评测系统将生成的研究报告与其来源材料进行对比，以检测非事实或幻觉内容，确保研究输出的可靠性和准确性。

### 组件

- `run_eval.py`：对 GPT-Researcher 执行评测的脚本
- `evaluate.py`：用于检测幻觉的核心评测逻辑
- `inputs/`：包含测试查询的目录
  - `search_queries.jsonl`：用于评测的研究查询集合
- `results/`：包含评测结果的目录
  - `evaluation_records.jsonl`：详细的每查询评测记录
  - `aggregate_results.json`：所有评测的汇总指标

### 特性

- 将研究报告与来源材料进行对比评估
- 为幻觉检测提供详细的推理

### 运行评测

1. 安装依赖：
```bash
cd evals/hallucination_eval
pip install -r requirements.txt
```

2. 在 `.env` 文件中配置环境变量：
```bash
# 使用根目录的 .env 文件
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
```

3. 运行评测：
```bash
python run_eval.py -n <number_of_queries>
```

`-n` 参数决定要从测试集中评估多少个查询（默认：1）。

### 输出示例
```json
{
  "total_queries": 1,
  "successful_queries": 1,
  "total_responses": 1,
  "total_evaluated": 1,
  "total_hallucinated": 0,
  "hallucination_rate": 0.0,
  "results": [
    {
      "input": "What are the latest developments in quantum computing?",
      "output": "Research report content...",
      "source": "Source material content...",
      "is_hallucination": false,
      "confidence_score": 0.95,
      "reasoning": "The summary accurately reflects the source material with proper citations..."
    }
  ]
}
```
