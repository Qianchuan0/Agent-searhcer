export const REPORT_TYPE_OPTIONS = [
  { value: 'research_report', label: '摘要报告', description: '简短快速，适合先看结论' },
  { value: 'deep', label: '深度研究报告', description: '更完整的多步骤研究流程' },
  { value: 'multi_agents', label: '多智能体报告', description: '由多个智能体协作完成' },
  { value: 'detailed_report', label: '详细报告', description: '内容更深入、更完整' },
] as const;

export const REPORT_SOURCE_OPTIONS = [
  { value: 'web', label: '互联网' },
  { value: 'local', label: '我的文档' },
  { value: 'hybrid', label: '混合来源' },
  { value: 'scholar', label: '学术资料' },
] as const;

export const TONE_OPTIONS = [
  { value: 'Objective', label: '客观', description: '中立呈现事实与结论' },
  { value: 'Formal', label: '正式', description: '更偏专业和书面表达' },
  { value: 'Analytical', label: '分析型', description: '强调推理、比较与拆解' },
  { value: 'Persuasive', label: '说服型', description: '更突出论证和观点表达' },
  { value: 'Informative', label: '信息型', description: '清晰完整地提供信息' },
  { value: 'Explanatory', label: '解释型', description: '适合说明复杂概念和过程' },
  { value: 'Descriptive', label: '描述型', description: '细致描述现象、案例和细节' },
  { value: 'Critical', label: '批判型', description: '强调评估、局限与风险' },
  { value: 'Comparative', label: '对比型', description: '突出不同方案或观点差异' },
  { value: 'Speculative', label: '推测型', description: '探索假设、影响和趋势' },
  { value: 'Reflective', label: '反思型', description: '关注过程、经验与思考' },
  { value: 'Narrative', label: '叙事型', description: '用更有故事感的方式组织内容' },
  { value: 'Humorous', label: '幽默型', description: '表达更轻松、更有趣' },
  { value: 'Optimistic', label: '乐观型', description: '强调积极结果和潜在收益' },
  { value: 'Pessimistic', label: '审慎型', description: '更关注限制、挑战和风险' },
  { value: 'Simple', label: '简明型', description: '用更简单直白的方式说明' },
  { value: 'Casual', label: '日常型', description: '更口语化、更自然' },
] as const;

export const LAYOUT_OPTIONS = [
  { value: 'research', label: '研究布局', description: '传统研究视图，结果更完整' },
  { value: 'copilot', label: '协作布局', description: '研究和对话并排展示' },
  { value: 'document', label: '文档布局', description: '更接近报告式阅读体验' },
] as const;

export function formatOptionLabel(label: string, description?: string) {
  return description ? `${label} - ${description}` : label;
}

function translateContextSourceText(text: string) {
  return text
    .replace(/\bweb content\b/gi, '网页内容')
    .replace(/\blocal documents\b/gi, '本地文档')
    .replace(/\bhybrid sources\b/gi, '混合来源')
    .replace(/\bscholar sources\b/gi, '学术来源');
}

function normalizeAgentLogText(text: string) {
  return text.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
}

export function translateAgentLogText(text: string) {
  const normalized = normalizeAgentLogText(text);

  const exactMap: Record<string, string> = {
    '已收到你的问题，正在启动研究任务...': '已收到你的问题，正在启动研究任务...',
    '正在连接研究服务并准备研究计划...': '正在连接研究服务并准备研究计划...',
    '研究服务已连接，正在发送任务并生成研究步骤...': '研究服务已连接，正在发送任务并生成研究步骤...',
    '研究服务已连接，但启动比平时更久，正在继续初始化...':
      '研究服务已连接，但启动比平时更久，正在继续初始化...',
    '暂时还没有返回内容，通常是在初始化模型、搜索或抓取数据...':
      '暂时还没有返回内容，通常是在初始化模型、搜索或抓取数据...',
    'Researching for relevant information across multiple sources...':
      '正在从多个来源检索相关信息...',
    'Researching for relevant information across multiple sources':
      '正在从多个来源检索相关信息...',
    'Planning the research strategy...': '正在规划研究策略...',
    'Planning research strategy...': '正在规划研究策略...',
    'Generating final report...': '正在生成最终报告...',
    'Finalizing report...': '正在整理最终报告...',
    'Analyzing collected information...': '正在分析已收集的信息...',
    'Scraping complete': '内容抓取完成',
  };

  if (exactMap[normalized]) {
    return exactMap[normalized];
  }

  const regexRules: Array<[RegExp, string | ((...args: string[]) => string)]> = [
    [/^Scraping content from (\d+) URLs?\.{0,3}$/i, '正在抓取 $1 个网址的内容...'],
    [/^Scraped (\d+) pages of content$/i, '已抓取 $1 页内容'],
    [/^Searching for (.+)\.{0,3}$/i, (_full, query) => `正在搜索：${query}...`],
    [/^Processing (.+)\.{0,3}$/i, (_full, target) => `正在处理：${target}...`],
    [/^Reading (.+)\.{0,3}$/i, (_full, target) => `正在读取：${target}...`],
    [
      /^Getting relevant content based on query:\s*(.+)$/i,
      (_full, query) => `正在根据问题检索相关内容：${query}`,
    ],
    [
      /^Combined research context:\s*(\d+)\s*MCP sources,\s*(.+)$/i,
      (_full, count, sourceText) =>
        `已合并研究上下文：${count} 个 MCP 来源，${translateContextSourceText(sourceText)}`,
    ],
    [
      /^Finalized research step\.\s*.*?Total Research Costs:\s*\$([0-9.]+)$/i,
      (_full, cost) => `研究步骤已完成，总研究成本：$${cost}`,
    ],
    [/^Writing report for ['"](.+?)['"]$/i, (_full, title) => `正在撰写报告：${title}`],
    [/^Report written for ['"](.+?)['"]$/i, (_full, title) => `报告已完成：${title}`],
  ];

  for (const [pattern, replacement] of regexRules) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }

    if (typeof replacement === 'string') {
      return normalized.replace(pattern, replacement);
    }

    return replacement(...match);
  }

  return normalized;
}
