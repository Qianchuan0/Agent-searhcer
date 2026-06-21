import { Data, QuestionData, StreamData } from '@/types/data';

export const RESEARCH_STATUS_KEYS = [
  'starting_research',
  'planning_research',
  'researching',
  'agent_generated',
  'error',
] as const;

type ResearchStatusKey = (typeof RESEARCH_STATUS_KEYS)[number];

export function createQuestionEvent(question: string): QuestionData {
  return {
    type: 'question',
    content: question,
  };
}

export function createStatusEvent(
  content: ResearchStatusKey,
  output: string,
  metadata: Record<string, any> = {}
): StreamData {
  return {
    type: 'logs',
    content,
    output,
    metadata: {
      source: 'client',
      ...metadata,
    },
    contentAndType: `${content}-logs`,
  };
}

export function createInitialResearchEvents(question: string): Data[] {
  return [
    createQuestionEvent(question),
    createStatusEvent('starting_research', '已收到你的问题，正在启动研究任务...'),
    createStatusEvent('planning_research', '正在连接研究服务并准备研究计划...'),
  ];
}

export function getLatestStatusMessage(allLogs: Array<{ text?: string }> = []) {
  for (let index = allLogs.length - 1; index >= 0; index -= 1) {
    const text = allLogs[index]?.text;
    if (typeof text === 'string' && text.trim()) {
      return text;
    }
  }

  return '正在准备研究任务...';
}
