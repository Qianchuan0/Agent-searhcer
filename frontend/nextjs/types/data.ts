export interface BaseData {
  type: string;
}

export interface BasicData extends BaseData {
  type: 'basic';
  content: string;
}

export interface LanggraphButtonData extends BaseData {
  type: 'langgraphButton';
  link: string;
}

export interface DifferencesData extends BaseData {
  type: 'differences';
  content: string;
  output: string;
}

export interface QuestionData extends BaseData {
  type: 'question';
  content: string;
}

export interface ChatData extends BaseData {
  type: 'chat';
  content: string;
  metadata?: any; // For storing search results and other contextual information
}

export interface HumanReviewRequest {
  type: 'plan_review';
  message: string;
  title?: string;
  sections: string[];
  revision_count?: number;
}

export interface ClarificationOption {
  id: string;
  label: string;
}

export interface ClarificationSection {
  id: string;
  title: string;
  description?: string;
  multiple?: boolean;
  required?: boolean;
  options: ClarificationOption[];
}

export interface ClarificationPayload {
  query: string;
  prompt: string;
  can_skip?: boolean;
  sections: ClarificationSection[];
  free_text_label?: string;
  free_text_placeholder?: string;
}

export interface StreamData extends BaseData {
  type: 'logs' | 'report' | 'report_complete' | 'path';
  content: string;
  output?: any;
  metadata?: any;
  contentAndType?: string;
}

export type Data =
  | BasicData
  | LanggraphButtonData
  | DifferencesData
  | QuestionData
  | ChatData
  | StreamData;

export interface MCPConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface ChatBoxSettings {
  report_type: string;
  report_source: string;
  tone: string;
  domains: string[];
  defaultReportType: string;
  layoutType: string;
  mcp_enabled: boolean;
  mcp_configs: MCPConfig[];
  mcp_strategy?: string;
  // 设计图右侧设置面板新增字段（可选，兼容旧 localStorage）
  research_depth?: number;
  visualize_results?: boolean;
  autosave?: boolean;
  notify?: boolean;
  agent_count?: number;
}

export interface Domain {
  value: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  metadata?: any; // For storing search results and other contextual information
}

export interface LangGraphRunContext {
  threadId: string;
  assistantId: string;
  host: string;
}

export interface ResearchHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  orderedData: Data[];
  chatMessages?: ChatMessage[];
}

export type MemoryType =
  | 'user_preference'
  | 'research_interest'
  | 'research_knowledge'
  | 'saved_context'
  | 'report_index';

export type MemoryStatus = 'active' | 'disabled' | 'deleted';
export type MemoryConfidence = 'low' | 'medium' | 'high';
export type ResearchRelation = 'new_topic' | 'follow_up' | 'refresh' | 'compare';

export interface MemorySource {
  kind: 'report' | 'conversation' | 'user_action';
  report_id?: string;
  message_id?: string;
  created_from?: string;
}

export interface MemoryItem {
  id: string;
  scope: 'local';
  type: MemoryType;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  source: MemorySource;
  confidence: MemoryConfidence;
  status: MemoryStatus;
  created_at: string;
  updated_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  embedding_id?: string | null;
}

export interface ResearchFinding {
  id: string;
  memory_id: string;
  claim: string;
  evidence_summary: string;
  source_report_id: string;
  source_urls: string[];
  confidence: MemoryConfidence;
  generated_at: string;
  staleness: 'fresh' | 'possibly_stale' | 'stale';
}

export interface MemorySuggestion {
  id: string;
  type: 'user_preference' | 'research_interest' | 'research_knowledge' | 'saved_context';
  title: string;
  content: string;
  reason: string;
  source_excerpt: string;
  default_action: 'review';
  source: MemorySource;
  tags: string[];
  confidence: MemoryConfidence;
}

export interface MemorySettings {
  enabled: boolean;
  updated_at: string;
}

export interface MemorySuggestionsResponse {
  suggestions: MemorySuggestion[];
  metadata?: {
    blocked?: boolean;
    reason?: string;
    count?: number;
  };
}

export interface MemoryCreateRequest {
  type: MemoryType;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  source: MemorySource;
  confidence?: MemoryConfidence;
  expires_at?: string | null;
}

export interface MemorySearchResult {
  item: MemoryItem;
  score: number;
  matched_terms: string[];
  findings: ResearchFinding[];
}

export interface MemorySearchResponse {
  results: MemorySearchResult[];
}

export interface ResearchClassificationResponse {
  relation: ResearchRelation;
  reason: string;
  suggested_strategy: string;
  related_memories: MemorySearchResult[];
}

export interface ReportMemoryResponse {
  report_id: string;
  memories: MemoryItem[];
  findings: ResearchFinding[];
  metadata: Record<string, unknown>;
}
