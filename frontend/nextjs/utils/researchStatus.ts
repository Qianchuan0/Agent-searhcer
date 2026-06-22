import { QuestionData, StreamData } from "@/types/data";

export const RESEARCH_STATUS_KEYS = [
  "starting_research",
  "planning_research",
  "researching",
  "agent_generated",
  "awaiting_human_feedback",
  "resuming_after_feedback",
  "error",
] as const;

type ResearchStatusKey = (typeof RESEARCH_STATUS_KEYS)[number];

export const LOCAL_RESEARCH_STATUS_MESSAGES = {
  received: "已收到你的问题，正在启动研究任务...",
  connecting: "正在连接研究服务并准备研究计划...",
  connected: "研究服务已连接，正在发送任务并生成研究步骤...",
  delayed: "研究服务已连接，但启动比平时更久，正在继续初始化...",
  waiting: "暂时还没有返回内容，通常是在初始化模型、搜索或抓取数据...",
  backendAccepted: "后端已接收任务，正在初始化研究流程...",
  backendPreparing: "正在准备研究角色、检索器和上下文环境...",
  backendRunning: "研究流程已启动，正在搜集可用来源...",
  awaitingHumanFeedback: "研究大纲已生成，请确认后继续执行。",
  resumingAfterFeedback: "已收到你的反馈，正在调整大纲并继续研究...",
  connectionFailed: "研究服务连接失败，请稍后重试。",
  defaultLoading: "正在准备研究任务...",
} as const;

export function createQuestionEvent(question: string): QuestionData {
  return {
    type: "question",
    content: question,
  };
}

export function createStatusEvent(
  content: ResearchStatusKey,
  output: string,
  metadata: Record<string, any> = {}
): StreamData {
  const source = metadata.source ?? "client";

  return {
    type: "logs",
    content,
    output,
    metadata: {
      source,
      createdAt: Date.now(),
      ...metadata,
    },
    contentAndType: `${content}-logs`,
  };
}

export function getLatestStatusMessage(allLogs: Array<{ text?: string }> = []) {
  for (let index = allLogs.length - 1; index >= 0; index -= 1) {
    const text = allLogs[index]?.text;
    if (typeof text === "string" && text.trim()) {
      return text;
    }
  }

  return LOCAL_RESEARCH_STATUS_MESSAGES.defaultLoading;
}
