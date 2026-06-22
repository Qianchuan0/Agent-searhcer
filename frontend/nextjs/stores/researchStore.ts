import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Data, ChatBoxSettings, HumanReviewRequest } from '@/types/data';

export type ActiveNav = 'home' | 'conversations' | 'workflow' | 'resources' | 'memory' | 'help';

/** 默认研究设置（复刻 app/page.tsx 原 defaultSettings） */
const DEFAULT_SETTINGS: ChatBoxSettings = {
  report_type: 'research_report',
  report_source: 'web',
  tone: 'Objective',
  domains: [],
  defaultReportType: 'research_report',
  layoutType: 'copilot',
  mcp_enabled: false,
  mcp_configs: [],
  mcp_strategy: 'fast',
  // 新增可选字段（设计图右侧面板）
  research_depth: 50,
  visualize_results: true,
  autosave: true,
  notify: false,
  agent_count: 3,
};

/** 从旧 'chatBoxSettings' localStorage 迁移初始设置 */
function loadInitialSettings(): ChatBoxSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('chatBoxSettings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error parsing saved settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// 函数式更新器类型（等价于 React.Dispatch<SetStateAction<T>>，严格兼容）
type SetAction<T> = (u: T | ((prev: T) => T)) => void;

interface ResearchState {
  // —— 原 app/page.tsx 的 17 个 useState ——
  promptValue: string;
  chatPromptValue: string;
  showResult: boolean;
  answer: string;
  loading: boolean;
  isInChatMode: boolean;
  chatBoxSettings: ChatBoxSettings;
  question: string;
  orderedData: Data[];
  showHumanFeedback: boolean;
  questionForHuman: string | HumanReviewRequest | null;
  allLogs: any[];
  isStopped: boolean;
  sidebarOpen: boolean;
  currentResearchId: string | null;
  isMobile: boolean;
  isProcessingChat: boolean;

  // —— UI 专属（不持久化）——
  inspectorOpen: boolean;
  activeNav: ActiveNav;

  // —— WebSocket 持有（不持久化，不可序列化）——
  socket: WebSocket | null;

  // —— setter：签名严格兼容 React.Dispatch<SetStateAction<T>> ——
  setOrderedData: SetAction<Data[]>;
  setAnswer: SetAction<string>;
  setLoading: SetAction<boolean>;
  setShowHumanFeedback: SetAction<boolean>;
  setQuestionForHuman: SetAction<string | HumanReviewRequest | null>;

  setSocket: (s: WebSocket | null) => void;
  setPromptValue: SetAction<string>;
  setChatPromptValue: SetAction<string>;
  setShowResult: SetAction<boolean>;
  setChatBoxSettings: SetAction<ChatBoxSettings>;
  setQuestion: SetAction<string>;
  setIsInChatMode: SetAction<boolean>;
  setIsStopped: SetAction<boolean>;
  setSidebarOpen: SetAction<boolean>;
  setCurrentResearchId: (id: string | null) => void;
  setIsMobile: SetAction<boolean>;
  setIsProcessingChat: SetAction<boolean>;
  setInspectorOpen: SetAction<boolean>;
  setActiveNav: (n: ActiveNav) => void;
  setAllLogs: SetAction<any[]>;

  /** 复刻 app/page.tsx reset() */
  reset: () => void;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set) => {
      // 生成兼容函数式更新的 setter
      const fset = <T,>(key: keyof ResearchState): SetAction<T> =>
        (u) =>
          set((s: any) => ({
            [key]: typeof u === 'function' ? (u as (p: T) => T)(s[key]) : u,
          }));

      return {
        promptValue: '',
        chatPromptValue: '',
        showResult: false,
        answer: '',
        loading: false,
        isInChatMode: false,
        chatBoxSettings: loadInitialSettings(),
        question: '',
        orderedData: [],
        showHumanFeedback: false,
        questionForHuman: null,
        allLogs: [],
        isStopped: false,
        sidebarOpen: false,
        currentResearchId: null,
        isMobile: false,
        isProcessingChat: false,

        inspectorOpen: true,
        activeNav: 'home',
        socket: null,

        setOrderedData: fset<Data[]>('orderedData'),
        setAnswer: fset<string>('answer'),
        setLoading: fset<boolean>('loading'),
        setShowHumanFeedback: fset<boolean>('showHumanFeedback'),
        setQuestionForHuman: fset<string | HumanReviewRequest | null>('questionForHuman'),

        setSocket: (s) => set({ socket: s }),
        setPromptValue: fset<string>('promptValue'),
        setChatPromptValue: fset<string>('chatPromptValue'),
        setShowResult: fset<boolean>('showResult'),
        setChatBoxSettings: fset<ChatBoxSettings>('chatBoxSettings'),
        setQuestion: fset<string>('question'),
        setIsInChatMode: fset<boolean>('isInChatMode'),
        setIsStopped: fset<boolean>('isStopped'),
        setSidebarOpen: fset<boolean>('sidebarOpen'),
        setCurrentResearchId: (id) => set({ currentResearchId: id }),
        setIsMobile: fset<boolean>('isMobile'),
        setIsProcessingChat: fset<boolean>('isProcessingChat'),
        setInspectorOpen: fset<boolean>('inspectorOpen'),
        setActiveNav: (n) => set({ activeNav: n }),
        setAllLogs: fset<any[]>('allLogs'),

        reset: () =>
          set({
            showResult: false,
            promptValue: '',
            isStopped: false,
            isInChatMode: false,
            currentResearchId: null,
            isProcessingChat: false,
            question: '',
            answer: '',
            orderedData: [],
            allLogs: [],
            showHumanFeedback: false,
            questionForHuman: null,
            loading: false,
          }),
      };
    },
    {
      name: 'gptr-research-ui',
      storage: createJSONStorage(() => localStorage),
      // 关键：只持久化 chatBoxSettings；socket/运行态绝不持久化
      partialize: (s) => ({ chatBoxSettings: s.chatBoxSettings }) as any,
    }
  )
);

export { DEFAULT_SETTINGS };
