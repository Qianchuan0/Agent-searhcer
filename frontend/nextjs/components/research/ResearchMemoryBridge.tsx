"use client";

import { ResearchClassificationResponse } from "@/types/data";

interface ResearchMemoryBridgeProps {
  classification: ResearchClassificationResponse;
  onUseMemory: () => void;
  onSkipMemory: () => void;
}

const relationLabelMap = {
  new_topic: "全新研究",
  follow_up: "旧主题追问",
  refresh: "旧主题刷新",
  compare: "旧主题对比",
} as const;

const confidenceLabelMap = {
  low: "低",
  medium: "中",
  high: "高",
} as const;

const stalenessLabelMap = {
  fresh: "较新",
  possibly_stale: "可能过期",
  stale: "已过期",
} as const;

function formatDate(value?: string) {
  if (!value) {
    return "未知时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        关系判断：{relationLabelMap[classification.relation]}。{classification.reason}
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
                    来源报告：{entry.item.source.report_id || "unknown"} | 相关度：{entry.score.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">
                    创建时间：{formatDate(entry.item.created_at)} | 可信度：
                    {confidenceLabelMap[entry.item.confidence]}
                  </p>
                  {!!entry.findings[0] && (
                    <p className="mt-1 text-xs text-ink-secondary">
                      时效性：{stalenessLabelMap[entry.findings[0].staleness]}
                    </p>
                  )}
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
