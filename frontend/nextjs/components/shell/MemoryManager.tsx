"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useResearchMemory } from "@/hooks/useResearchMemory";
import { MemoryItem, MemoryType } from "@/types/data";

const TYPE_OPTIONS: Array<{ value: MemoryType | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "user_preference", label: "偏好" },
  { value: "research_interest", label: "兴趣" },
  { value: "research_knowledge", label: "知识" },
  { value: "saved_context", label: "上下文" },
  { value: "report_index", label: "报告索引" },
];

const TYPE_LABELS: Record<MemoryType, string> = {
  user_preference: "用户偏好",
  research_interest: "研究兴趣",
  research_knowledge: "研究知识",
  saved_context: "会话上下文",
  report_index: "报告索引",
};

const STATUS_LABELS: Record<MemoryItem["status"], string> = {
  active: "启用中",
  disabled: "已停用",
  deleted: "已删除",
};

function MemoryToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="切换长期记忆"
      onClick={onChange}
      className="group relative h-14 w-[180px] rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-primary/40"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center justify-center text-[11px] font-semibold tracking-[0.2em] text-ink-secondary">
        OFF
      </span>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-center text-[11px] font-semibold tracking-[0.2em] text-ink-secondary">
        ON
      </span>

      <span
        className={`absolute top-1 z-10 flex h-[calc(100%-8px)] w-[calc(50%-4px)] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(30,144,255,0.92),rgba(74,222,128,0.92))] text-[11px] font-semibold tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(26,158,255,0.32)] transition-transform duration-300 ease-out ${
          enabled ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function ItemCard({
  item,
  onDisable,
  onDelete,
}: {
  item: MemoryItem;
  onDisable: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {TYPE_LABELS[item.type]}
          </p>
          <h4 className="mt-1 text-sm font-semibold text-ink">{item.title}</h4>
        </div>
        <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-ink-secondary">
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink-secondary">{item.summary}</p>

      {!!item.tags.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-ink-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {item.status === "active" && (
          <button type="button" onClick={onDisable} className="ghost-btn px-3 py-1.5 text-xs">
            停用
          </button>
        )}
        <button type="button" onClick={onDelete} className="ghost-btn px-3 py-1.5 text-xs text-red-400">
          删除
        </button>
      </div>
    </article>
  );
}

export default function MemoryManager() {
  const {
    settings,
    items,
    loading,
    updateSettings,
    refreshItems,
    updateItem,
    deleteItem,
  } = useResearchMemory();
  const [selectedType, setSelectedType] = useState<MemoryType | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedType === "all") {
      return items;
    }
    return items.filter((item) => item.type === selectedType);
  }, [items, selectedType]);

  const activeCount = useMemo(
    () => items.filter((item) => item.status === "active").length,
    [items]
  );

  const handleToggle = async () => {
    const nextEnabled = !settings?.enabled;
    try {
      await updateSettings(nextEnabled);
      toast.success(nextEnabled ? "长期记忆已开启" : "长期记忆已关闭");
      await refreshItems();
    } catch (error) {
      console.error(error);
      toast.error("更新长期记忆设置失败");
    }
  };

  const handleDisable = async (item: MemoryItem) => {
    setBusyId(item.id);
    try {
      await updateItem(item.id, { status: "disabled" });
      toast.success("该记忆已停用");
    } catch (error) {
      console.error(error);
      toast.error("停用记忆失败");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: MemoryItem) => {
    setBusyId(item.id);
    try {
      await deleteItem(item.id);
      toast.success("该记忆已删除");
      await refreshItems();
    } catch (error) {
      console.error(error);
      toast.error("删除记忆失败");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top,rgba(26,158,255,0.14),transparent_38%)] px-5 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Long-Term Memory
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">长期记忆工作台</h2>
              <p className="mt-3 text-sm leading-6 text-ink-secondary">
                把跨研究可复用的偏好、知识和上下文沉淀下来。新研究开始前会先判断是否存在相关历史记忆，再决定是否承接。
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-3xl border border-white/8 bg-black/15 p-4">
              <div>
                <p className="text-xs font-medium text-ink-secondary">长期记忆开关</p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {settings?.enabled ? "当前已启用，研究后可生成记忆建议。" : "当前已关闭，不会生成和复用长期记忆。"}
                </p>
              </div>
              <MemoryToggle enabled={!!settings?.enabled} onChange={() => void handleToggle()} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">总记忆</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">启用中</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">当前筛选</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{filteredItems.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  selectedType === option.value
                    ? "bg-primary text-white shadow-glow-primary"
                    : "bg-white/[0.05] text-ink-secondary hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-ink-secondary">正在读取长期记忆...</p>
            ) : filteredItems.length ? (
              filteredItems.map((item) => (
                <div key={item.id} className={busyId === item.id ? "opacity-70" : ""}>
                  <ItemCard
                    item={item}
                    onDisable={() => void handleDisable(item)}
                    onDelete={() => void handleDelete(item)}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center">
                <p className="text-sm text-ink-secondary">当前筛选下还没有记忆条目。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
