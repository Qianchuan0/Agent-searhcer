"use client";

import { ResearchClassificationResponse } from "@/types/data";

interface ResearchMemoryBridgeProps {
  classification: ResearchClassificationResponse;
  onUseMemory: () => void;
  onSkipMemory: () => void;
}

export default function ResearchMemoryBridge({
  classification,
  onUseMemory,
  onSkipMemory,
}: ResearchMemoryBridgeProps) {
  const related = classification.related_memories || [];

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Research Continuity
      </p>
      <h3 className="mt-1 text-base font-semibold text-ink">发现相关历史研究</h3>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        关系判断：{classification.relation}。{classification.reason}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        建议策略：{classification.suggested_strategy}
      </p>

      {!!related.length && (
        <div className="mt-4 space-y-3">
          {related.slice(0, 3).map((entry) => (
            <article
              key={entry.item.id}
              className="rounded-xl border border-[var(--border)] bg-white/[0.7] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-ink">{entry.item.title}</h4>
                  <p className="mt-1 text-xs text-ink-secondary">
                    来源报告：{entry.item.source.report_id || "unknown"} · 相关度 {entry.score.toFixed(2)}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
                  {entry.item.type}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink">{entry.item.summary}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onUseMemory} className="neon-btn px-4 py-2 text-sm">
          带着历史结论继续
        </button>
        <button type="button" onClick={onSkipMemory} className="ghost-btn px-4 py-2 text-sm">
          忽略旧记忆，重新研究
        </button>
      </div>
    </section>
  );
}
