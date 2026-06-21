'use client';

import { toast } from 'react-hot-toast';
import { useResearchStore, DEFAULT_SETTINGS } from '@/stores/researchStore';
import { ChatBoxSettings } from '@/types/data';
import {
  REPORT_SOURCE_OPTIONS,
  REPORT_TYPE_OPTIONS,
  TONE_OPTIONS,
} from '@/utils/uiLabels';

const REPORT_TYPES = REPORT_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const REPORT_SOURCES = REPORT_SOURCE_OPTIONS.filter((option) =>
  ['web', 'local', 'hybrid'].includes(option.value)
).map((option) => ({
  value: option.value,
  label: option.label,
}));

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] bg-white/[0.04] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
            value === option.value
              ? 'bg-primary text-white shadow-glow-primary'
              : 'text-ink-secondary hover:bg-white/[0.04] hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-ink-secondary">{label}</label>
      {children}
    </div>
  );
}

export default function InspectorControls() {
  const chatBoxSettings = useResearchStore((state) => state.chatBoxSettings);
  const setChatBoxSettings = useResearchStore((state) => state.setChatBoxSettings);

  const update = <K extends keyof ChatBoxSettings>(key: K, value: ChatBoxSettings[K]) =>
    setChatBoxSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatBoxSettings', JSON.stringify(chatBoxSettings));
    }
    toast.success('设置已保存');
  };

  const handleReset = () => {
    setChatBoxSettings(DEFAULT_SETTINGS);
    toast.success('设置已恢复默认');
  };

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          研究设置
        </h3>

        <Field label="报告类型">
          <Segmented
            options={REPORT_TYPES}
            value={chatBoxSettings.report_type as any}
            onChange={(value) => update('report_type', value)}
          />
        </Field>

        <Field label="报告来源">
          <Segmented
            options={REPORT_SOURCES}
            value={chatBoxSettings.report_source as any}
            onChange={(value) => update('report_source', value)}
          />
        </Field>

        <Field label="语气风格">
          <select
            value={chatBoxSettings.tone}
            onChange={(e) => update('tone', e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-surface-elevated">
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={handleSave} className="neon-btn flex-1 py-2 text-sm">
          保存设置
        </button>
        <button type="button" onClick={handleReset} className="ghost-btn flex-1 py-2 text-sm">
          重置
        </button>
      </div>
    </div>
  );
}
