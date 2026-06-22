"use client";

import { MemorySuggestion } from "@/types/data";

interface MemorySuggestionPanelProps {
  suggestions: MemorySuggestion[];
  savingSuggestionId?: string | null;
  onSave: (suggestion: MemorySuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
}

const typeLabels: Record<MemorySuggestion["type"], string> = {
  user_preference: "用户偏好",
  research_interest: "研究兴趣",
  research_knowledge: "研究知识",
  saved_context: "会话上下文",
};

const confidenceLabels = {
  low: "低",
  medium: "中",
  high: "高",
} as const;

export default function MemorySuggestionPanel({
  suggestions,
  savingSuggestionId = null,
  onSave,
  onDismiss,
  onDismissAll,
  onClose,
}: MemorySuggestionPanelProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Long-Term Memory
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">建议保存到长期记忆</h3>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            这些内容来自刚完成的研究。只有在你确认后，系统才会写入长期记忆。
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-ink-secondary transition hover:border-primary hover:text-ink"
        >
          稍后再看
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <p className="text-xs text-ink-secondary">
          共 {suggestions.length} 条建议，可逐条保存或忽略。
        </p>
        <button type="button" onClick={onDismissAll} className="ghost-btn px-3 py-1.5 text-xs">
          全部忽略
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {suggestions.map((suggestion) => {
          const isSaving = savingSuggestionId === suggestion.id;
          return (
            <article
              key={suggestion.id}
              className="rounded-2xl border border-[var(--border)] bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-primary">
                    {typeLabels[suggestion.type]}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-ink">{suggestion.title}</h4>
                </div>
                <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
                  可信度 {confidenceLabels[suggestion.confidence]}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-ink">{suggestion.content}</p>
              <p className="mt-3 text-xs leading-5 text-ink-secondary">
                保存理由：{suggestion.reason}
              </p>

              {suggestion.source_excerpt && (
                <div className="mt-3 rounded-xl bg-black/10 px-3 py-2 text-xs leading-5 text-ink-secondary">
                  来源片段：{suggestion.source_excerpt}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSave(suggestion)}
                  disabled={isSaving}
                  className="neon-btn px-3 py-1.5 text-xs disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "保存到记忆"}
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(suggestion.id)}
                  className="ghost-btn px-3 py-1.5 text-xs"
                >
                  忽略
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
