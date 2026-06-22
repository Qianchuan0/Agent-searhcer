"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MemorySearchResult, ResearchClassificationResponse } from "@/types/data";

interface ResearchMemoryBridgeProps {
  classification: ResearchClassificationResponse;
  onUseMemory: (selectedMemories: MemorySearchResult[]) => void;
  onSkipMemory: () => void;
}

const relationLabelMap = {
  new_topic: "全新研究",
  follow_up: "旧主题追问",
  refresh: "旧主题刷新",
  compare: "对比研究",
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
  const [mounted, setMounted] = useState(false);
  const related = classification.related_memories || [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      setMounted(false);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setSelectedIds(related.slice(0, 3).map((entry) => entry.item.id));
  }, [related]);

  const selectedMemories = useMemo(
    () => related.filter((entry) => selectedIds.includes(entry.item.id)),
    [related, selectedIds]
  );

  const toggleSelection = (memoryId: string) => {
    setSelectedIds((current) =>
      current.includes(memoryId)
        ? current.filter((id) => id !== memoryId)
        : [...current, memoryId]
    );
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-[4px]"
      />

      <div className="fixed inset-0 z-[141] flex items-center justify-center p-3 sm:p-5">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="flex max-h-[88vh] w-[min(860px,100%)] flex-col overflow-hidden rounded-[28px] border border-primary/30 bg-[var(--surface)] shadow-2xl"
        >
          <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Research Continuity
            </p>
            <h3 className="mt-2 text-xl font-semibold text-ink">发现相关历史研究</h3>
            <p className="mt-3 text-sm leading-6 text-ink-secondary">
              关系判断：{relationLabelMap[classification.relation]}。{classification.reason}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              建议策略：{classification.suggested_strategy}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
              <span className="rounded-full border border-[var(--border)] px-3 py-1">
                已选 {selectedMemories.length} 条
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(related.map((entry) => entry.item.id))}
                className="rounded-full border border-[var(--border)] px-3 py-1 transition hover:border-primary/50 hover:text-ink"
              >
                全选
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-full border border-[var(--border)] px-3 py-1 transition hover:border-primary/50 hover:text-ink"
              >
                清空
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
            {related.length ? (
              related.slice(0, 5).map((entry) => {
                const checked = selectedIds.includes(entry.item.id);
                return (
                  <button
                    key={entry.item.id}
                    type="button"
                    onClick={() => toggleSelection(entry.item.id)}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      checked
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]"
                        : "border-[var(--border)] bg-white/[0.04] hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-[var(--border)] bg-black/10 text-transparent"
                        }`}
                      >
                        ✓
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-ink">{entry.item.title}</h4>
                            <p className="mt-1 text-xs text-ink-secondary">
                              来源报告：{entry.item.source.report_id || "unknown"} | 相关度：
                              {entry.score.toFixed(2)}
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

                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink">
                          {entry.item.summary}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center">
                <p className="text-sm text-ink-secondary">
                  没有可展示的历史结论，但系统判定当前问题与旧研究存在关联。
                </p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:px-6">
            <p className="text-xs text-ink-secondary">
              只会把你选中的结论作为“历史研究上下文”带入新一轮研究。
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onSkipMemory}
                className="ghost-btn px-4 py-2 text-sm"
              >
                全新研究
              </button>
              <button
                type="button"
                onClick={() => onUseMemory(selectedMemories)}
                disabled={!selectedMemories.length}
                className="neon-btn px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                带着所选结论继续
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body
  );
}
