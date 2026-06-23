"use client";

import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { title: string; core_claim: string; content: string }>
  >({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const suggestion of suggestions) {
        if (!next[suggestion.id]) {
          next[suggestion.id] = {
            title: suggestion.title,
            core_claim: suggestion.core_claim ?? "",
            content: suggestion.content,
          };
        }
      }
      for (const suggestionId of Object.keys(next)) {
        if (!suggestions.some((item) => item.id === suggestionId)) {
          delete next[suggestionId];
        }
      }
      return next;
    });
  }, [suggestions]);

  const updateDraft = (
    suggestionId: string,
    field: "title" | "core_claim" | "content",
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [suggestionId]: {
        title: prev[suggestionId]?.title ?? "",
        core_claim: prev[suggestionId]?.core_claim ?? "",
        content: prev[suggestionId]?.content ?? "",
        [field]: value,
      },
    }));
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Long-Term Memory
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">建议保存到长期记忆</h3>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            这些内容来自刚完成的研究。你可以先编辑，再决定是否写入长期记忆。
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
          共 {suggestions.length} 条建议，可逐条编辑、保存或忽略。
        </p>
        <button type="button" onClick={onDismissAll} className="ghost-btn px-3 py-1.5 text-xs">
          全部忽略
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {suggestions.map((suggestion) => {
          const isSaving = savingSuggestionId === suggestion.id;
          const isEditing = editingId === suggestion.id;
          const draft = drafts[suggestion.id] ?? {
            title: suggestion.title,
            core_claim: suggestion.core_claim ?? "",
            content: suggestion.content,
          };

          return (
            <article
              key={suggestion.id}
              className="rounded-2xl border border-[var(--border)] bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-primary">{typeLabels[suggestion.type]}</p>
                  {isEditing ? (
                    <input
                      value={draft.title}
                      onChange={(event) => updateDraft(suggestion.id, "title", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                    />
                  ) : (
                    <h4 className="mt-1 text-sm font-semibold text-ink">{draft.title}</h4>
                  )}
                </div>
                <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
                  可信度：{confidenceLabels[suggestion.confidence]}
                </span>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3">
                  {suggestion.core_claim !== undefined && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary/80">
                        核心结论候选
                      </p>
                      <textarea
                        value={draft.core_claim}
                        onChange={(event) =>
                          updateDraft(suggestion.id, "core_claim", event.target.value)
                        }
                        className="mt-2 min-h-[88px] w-full rounded-2xl border border-[var(--border)] bg-black/10 px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-primary"
                      />
                    </div>
                  )}
                  <textarea
                    value={draft.content}
                    onChange={(event) => updateDraft(suggestion.id, "content", event.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-black/10 px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {suggestion.core_claim && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/8 px-3 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary/80">
                        核心结论候选
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink">{draft.core_claim}</p>
                    </div>
                  )}
                  <p className="text-sm leading-6 text-ink">{draft.content}</p>
                </div>
              )}

              <p className="mt-3 text-xs leading-5 text-ink-secondary">
                保存理由：{suggestion.reason}
              </p>

              {suggestion.source_excerpt && (
                <div className="mt-3 rounded-xl bg-black/10 px-3 py-2 text-xs leading-5 text-ink-secondary">
                  来源片段：{suggestion.source_excerpt}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSave({
                      ...suggestion,
                      title: draft.title.trim() || suggestion.title,
                      core_claim:
                        suggestion.core_claim !== undefined
                          ? draft.core_claim.trim() || suggestion.core_claim
                          : suggestion.core_claim,
                      content: draft.content.trim() || suggestion.content,
                    })
                  }
                  disabled={isSaving}
                  className="neon-btn px-3 py-1.5 text-xs disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "保存到记忆"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : suggestion.id)}
                  className="ghost-btn px-3 py-1.5 text-xs"
                >
                  {isEditing ? "完成编辑" : "编辑后保存"}
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
