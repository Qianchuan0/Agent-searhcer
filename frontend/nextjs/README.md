# agent Researcher UI

一个 React 组件库，用于将 agent Researcher 界面集成到你的 React 应用中。可以使用 [GPTR React Starter 模板](https://github.com/elishakay/gpt-researcher-react) 试跑，或直接：

<div align="center" id="top">

<img src="https://github.com/assafelovic/gpt-researcher/assets/13554167/20af8286-b386-44a5-9a83-3be1365139c3" alt="Logo" width="80">

####

[![Website](https://img.shields.io/badge/Official%20Website-gptr.dev-teal?style=for-the-badge&logo=world&logoColor=white&color=0891b2)](https://gptr.dev)
[![Documentation](https://img.shields.io/badge/Documentation-DOCS-f472b6?logo=googledocs&logoColor=white&style=for-the-badge)](https://docs.gptr.dev)
[![Discord Follow](https://dcbadge.vercel.app/api/server/QgZXvJAccX?style=for-the-badge&theme=clean-inverted&?compact=true)](https://discord.gg/QgZXvJAccX)

[![PyPI version](https://img.shields.io/pypi/v/gpt-researcher?logo=pypi&logoColor=white&style=flat)](https://badge.fury.io/py/gpt-researcher)
![GitHub Release](https://img.shields.io/github/v/release/assafelovic/gpt-researcher?style=flat&logo=github)
[![Open In Colab](https://img.shields.io/static/v1?message=Open%20in%20Colab&logo=googlecolab&labelColor=grey&color=yellow&label=%20&style=flat&logoSize=40)](https://colab.research.google.com/github/assafelovic/gpt-researcher/blob/master/docs/docs/examples/pip-run.ipynb)
[![Docker Image Version](https://img.shields.io/docker/v/elestio/gpt-researcher/latest?arch=amd64&style=flat&logo=docker&logoColor=white&color=1D63ED)](https://hub.docker.com/r/gptresearcher/gpt-researcher)

[English](README.md) | [中文](README-zh_CN.md) | [日本語](README-ja_JP.md) | [한국어](README-ko_KR.md)

</div>

# 🔎 agent Researcher

**agent Researcher 是一个开源的深度研究 agent，专为任意任务的 Web 和本地研究而设计。**

该 agent 能生成带引用的详细、真实、客观的研究报告。agent Researcher 提供一整套自定义选项，可创建量身定制的、特定领域的研究 agent。受最新的 [Plan-and-Solve](https://arxiv.org/abs/2305.04091) 和 [RAG](https://arxiv.org/abs/2005.11401) 论文启发，agent Researcher 通过并行化的 agent 工作提供稳定的性能和更快的速度，从而应对错误信息、速度、确定性和可靠性等问题。

**我们的使命是通过 AI 赋能个人和组织，提供准确、客观、真实的信息。**


## 安装

```bash
npm install gpt-researcher-ui
```

## 使用

```javascript
import React from 'react';
import { GPTResearcher } from 'gpt-researcher-ui';

function App() {
  return (
    <div className="App">
      <GPTResearcher 
        apiUrl="http://localhost:8000"
        defaultPrompt="What is quantum computing?"
        onResultsChange={(results) => console.log('Research results:', results)}
      />
    </div>
  );
}

export default App;
```

## 高级用法

```javascript
import React, { useState } from 'react';
import { GPTResearcher } from 'gpt-researcher-ui';

function App() {
  const [results, setResults] = useState([]);

  const handleResultsChange = (newResults) => {
    setResults(newResults);
    console.log('Research progress:', newResults);
  };

  return (
    <div className="App">
      <h1>My Research Application</h1>
      
      <GPTResearcher 
        apiUrl="http://localhost:8000"
        apiKey="your-api-key-if-needed"
        defaultPrompt="Explain the impact of quantum computing on cryptography"
        onResultsChange={handleResultsChange}
      />
      
      {/* 你可以在应用的其他地方使用 results 状态 */}
      <div className="results-summary">
        {results.length > 0 && (
          <p>Research in progress: {results.length} items processed</p>
        )}
      </div>
    </div>
  );
}

export default App;
```
