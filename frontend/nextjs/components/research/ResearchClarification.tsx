import { ClarificationPayload } from "@/types/data";
import { useMemo, useState } from "react";

interface ResearchClarificationProps {
  payload: ClarificationPayload;
  isSubmitting?: boolean;
  onSkip: () => void;
  onSubmit: (result: {
    selections: Record<string, string[]>;
    note: string;
  }) => void;
}

export default function ResearchClarification({
  payload,
  isSubmitting = false,
  onSkip,
  onSubmit,
}: ResearchClarificationProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");

  const missingRequired = useMemo(() => {
    return payload.sections.some((section) => {
      if (!section.required) return false;
      const values = selections[section.id] || [];
      return values.length === 0;
    });
  }, [payload.sections, selections]);

  const toggleOption = (sectionId: string, optionId: string, multiple = false) => {
    setSelections((prev) => {
      const current = prev[sectionId] || [];
      const exists = current.includes(optionId);

      if (multiple) {
        return {
          ...prev,
          [sectionId]: exists
            ? current.filter((item) => item !== optionId)
            : [...current, optionId],
        };
      }

      return {
        ...prev,
        [sectionId]: exists ? [] : [optionId],
      };
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-slate-400">你的需求</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{payload.query}</h2>
      </div>

      <div className="rounded-[24px] border border-primary-500/20 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]">
        <p className="text-sm text-slate-300">{payload.prompt}</p>
      </div>

      {payload.sections.map((section) => {
        const selected = selections[section.id] || [];
        return (
          <div
            key={section.id}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6"
          >
            <h3 className="text-xl font-semibold text-white">{section.title}</h3>
            {section.description ? (
              <p className="mt-2 text-sm text-slate-400">{section.description}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {section.options.map((option) => {
                const active = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(section.id, option.id, section.multiple)}
                    className={`rounded-full px-5 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-200/90 text-emerald-950 shadow-[0_10px_30px_rgba(167,243,208,0.25)]"
                        : "border border-emerald-100/10 bg-emerald-100/5 text-slate-200 hover:bg-emerald-100/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-xl font-semibold text-white">
          {payload.free_text_label || "补充说明"}
        </h3>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            payload.free_text_placeholder || "可补充背景信息、时间范围、竞品名单或特殊要求"
          }
          className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-primary-400/60"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="text-sm text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
        >
          跳过，直接开始
        </button>

        <button
          type="button"
          onClick={() => onSubmit({ selections, note })}
          disabled={isSubmitting || missingRequired}
          className="rounded-2xl bg-emerald-200 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "正在启动调研..." : "启动调研"}
        </button>
      </div>
    </div>
  );
}
