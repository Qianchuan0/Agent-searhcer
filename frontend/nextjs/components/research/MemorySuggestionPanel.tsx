"use client";

import { MemorySuggestion } from "@/types/data";

interface MemorySuggestionPanelProps {
  suggestions: MemorySuggestion[];
  savingSuggestionId?: string | null;
  onSave: (suggestion: MemorySuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll: () => void;
}

export default function MemorySuggestionPanel({
  suggestions,
  savingSuggestionId = null,
  onSave,
  onDismiss,
  onDismissAll,
}: MemorySuggestionPanelProps) {
  if (!suggestions.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/[0.04] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Long-Term Memory
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">建议保存到长期记忆</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            这些内容来自刚完成的研究。你可以逐条保存，也可以先全部忽略。
          </p>
        </div>
        <button type="button" onClick={onDismissAll} className="ghost-btn px-3 py-1.5 text-xs">
          全部忽略
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {suggestions.map((suggestion) => {
          const isSaving = savingSuggestionId === suggestion.id;
          return (
            <article
              key={suggestion.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-primary">{suggestion.type}</p>
                  <h4 className="mt-1 text-sm font-semibold text-ink">{suggestion.title}</h4>
                </div>
                <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
                  {suggestion.confidence}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-ink">{suggestion.content}</p>
              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                保存理由：{suggestion.reason}
              </p>
              {suggestion.source_excerpt && (
                <div className="mt-3 rounded-lg bg-black/10 px-3 py-2 text-xs leading-5 text-ink-secondary">
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
