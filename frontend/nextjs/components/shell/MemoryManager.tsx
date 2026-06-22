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
    <article className="rounded-xl border border-[var(--border)] bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-primary">{item.type}</p>
          <h4 className="mt-1 text-sm font-semibold text-ink">{item.title}</h4>
        </div>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
          {item.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-secondary">{item.summary}</p>
      {!!item.tags.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-1 text-[11px] text-ink-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {item.status === "active" && (
          <button type="button" onClick={onDisable} className="ghost-btn px-2.5 py-1 text-xs">
            停用
          </button>
        )}
        <button type="button" onClick={onDelete} className="ghost-btn px-2.5 py-1 text-xs text-red-400">
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

  const handleToggle = async () => {
    try {
      await updateSettings(!settings?.enabled);
      toast.success(!settings?.enabled ? "已开启长期记忆" : "已关闭长期记忆");
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
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Memory
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">长期记忆</h3>
          <p className="mt-1 text-xs leading-5 text-ink-secondary">
            开启后，系统会允许保存跨研究复用的偏好、知识和上下文。
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            settings?.enabled ? "bg-primary text-white" : "bg-white/[0.06] text-ink-secondary"
          }`}
        >
          {settings?.enabled ? "已开启" : "已关闭"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelectedType(option.value)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              selectedType === option.value
                ? "bg-primary text-white"
                : "bg-white/[0.05] text-ink-secondary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-ink-secondary">正在读取长期记忆...</p>
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
          <p className="text-xs leading-5 text-ink-secondary">
            当前筛选条件下还没有记忆条目。
          </p>
        )}
      </div>
    </section>
  );
}
