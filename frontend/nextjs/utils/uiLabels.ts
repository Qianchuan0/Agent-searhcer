export const REPORT_TYPE_OPTIONS = [
  { value: 'research_report', label: '摘要报告', description: '简短快速（约 2 分钟）' },
  { value: 'deep', label: '深度研究报告', description: '更强的多步骤研究流程' },
  { value: 'multi_agents', label: '多智能体报告', description: '由多个智能体协作完成' },
  { value: 'detailed_report', label: '详细报告', description: '更深入、更完整（约 5 分钟）' },
] as const;

export const REPORT_SOURCE_OPTIONS = [
  { value: 'web', label: '互联网' },
  { value: 'local', label: '我的文档' },
  { value: 'hybrid', label: '混合来源' },
  { value: 'scholar', label: '学术资料' },
] as const;

export const TONE_OPTIONS = [
  { value: 'Objective', label: '客观', description: '中立、无偏见地呈现事实与结论' },
  { value: 'Formal', label: '正式', description: '更符合学术和专业表达习惯' },
  { value: 'Analytical', label: '分析型', description: '强调推理、比较与深入拆解' },
  { value: 'Persuasive', label: '说服型', description: '更突出论证和观点说服力' },
  { value: 'Informative', label: '信息型', description: '清晰完整地提供信息' },
  { value: 'Explanatory', label: '解释型', description: '更适合说明复杂概念和过程' },
  { value: 'Descriptive', label: '描述型', description: '细致描写现象、案例和细节' },
  { value: 'Critical', label: '批判型', description: '强调评估有效性、局限与风险' },
  { value: 'Comparative', label: '对比型', description: '突出不同方案、理论或数据差异' },
  { value: 'Speculative', label: '推测型', description: '探索假设、影响和未来方向' },
  { value: 'Reflective', label: '反思型', description: '关注过程、经验与思考' },
  { value: 'Narrative', label: '叙事型', description: '以更有故事感的方式组织内容' },
  { value: 'Humorous', label: '幽默型', description: '更轻松、更有趣、更易读' },
  { value: 'Optimistic', label: '乐观型', description: '强调积极结果和潜在收益' },
  { value: 'Pessimistic', label: '审慎型', description: '更关注限制、挑战和负面影响' },
  { value: 'Simple', label: '简明型', description: '用更简单的词汇和表达方式说明' },
  { value: 'Casual', label: '日常型', description: '更口语化、更轻松自然' },
] as const;

export const LAYOUT_OPTIONS = [
  { value: 'research', label: '研究布局', description: '传统研究视图，结果更完整' },
  { value: 'copilot', label: '协作布局', description: '研究与聊天并排显示' },
  { value: 'document', label: '文档布局', description: '更接近传统报告阅读方式' },
] as const;

export function formatOptionLabel(label: string, description?: string) {
  return description ? `${label} - ${description}` : label;
}

export function translateAgentLogText(text: string) {
  const exactMap: Record<string, string> = {
    '已收到你的问题，正在启动研究任务...': '已收到你的问题，正在启动研究任务...',
    '正在连接研究服务并准备研究计划...': '正在连接研究服务并准备研究计划...',
    '研究服务已连接，正在发送任务并生成研究步骤...': '研究服务已连接，正在发送任务并生成研究步骤...',
    '研究服务已连接，但启动比平时更久，正在继续初始化...': '研究服务已连接，但启动比平时更久，正在继续初始化...',
    '暂时还没有返回内容，通常是在初始化模型、搜索或抓取数据...': '暂时还没有返回内容，通常是在初始化模型、搜索或抓取数据...',
    'Researching for relevant information across multiple sources...': '正在从多个来源检索相关信息...',
    'Researching for relevant information across multiple sources': '正在从多个来源检索相关信息...',
    'Planning the research strategy...': '正在规划研究策略...',
    'Planning research strategy...': '正在规划研究策略...',
    'Generating final report...': '正在生成最终报告...',
    'Finalizing report...': '正在整理最终报告...',
    'Analyzing collected information...': '正在分析已收集的信息...',
  };

  if (exactMap[text]) {
    return exactMap[text];
  }

  const regexRules: Array<[RegExp, string]> = [
    [/^Scraping content from (\d+) URLs?\.{0,3}$/i, '正在抓取 $1 个网址的内容...'],
    [/^Searching for (.+)\.{0,3}$/i, '正在搜索：$1...'],
    [/^Processing (.+)\.{0,3}$/i, '正在处理：$1...'],
    [/^Reading (.+)\.{0,3}$/i, '正在读取：$1...'],
  ];

  for (const [pattern, replacement] of regexRules) {
    if (pattern.test(text)) {
      return text.replace(pattern, replacement);
    }
  }

  return text;
}
