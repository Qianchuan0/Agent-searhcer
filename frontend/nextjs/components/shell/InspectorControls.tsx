'use client';

import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
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
    <div className="flex rounded-lg bg-white/[0.04] p-1 border border-[var(--border)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
            value === option.value
              ? 'bg-primary text-white shadow-glow-primary'
              : 'text-ink-secondary hover:text-ink hover:bg-white/[0.04]'
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink-secondary">{label}</label>
        {hint && <span className="text-[10px] text-ink-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-ink-secondary">{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-5 w-9 rounded-full bg-white/15 data-[state=checked]:bg-primary transition-colors"
      >
        <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
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

      <div className="h-px bg-[var(--border)]" />

      <section className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          研究参数
        </h3>

        <Field label="研究深度" hint={`${chatBoxSettings.research_depth ?? 50}%`}>
          <Slider.Root
            value={[chatBoxSettings.research_depth ?? 50]}
            max={100}
            step={5}
            onValueChange={([value]) => update('research_depth', value)}
            className="relative flex h-4 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-white/15">
              <Slider.Range className="absolute h-full rounded-full bg-indigo-gradient" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-white shadow-md focus:outline-none" />
          </Slider.Root>
        </Field>

        <Field label="智能体数量" hint={`${chatBoxSettings.agent_count ?? 3} 个`}>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => update('agent_count', count)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                  (chatBoxSettings.agent_count ?? 3) === count
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'bg-white/[0.04] text-ink-secondary hover:text-ink border border-[var(--border)]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </Field>
      </section>

      <div className="h-px bg-[var(--border)]" />

      <section className="space-y-1">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          偏好
        </h3>
        <SwitchRow
          label="结果可视化"
          checked={chatBoxSettings.visualize_results ?? true}
          onChange={(value) => update('visualize_results', value)}
        />
        <SwitchRow
          label="自动保存"
          checked={chatBoxSettings.autosave ?? true}
          onChange={(value) => update('autosave', value)}
        />
        <SwitchRow
          label="通知提醒"
          checked={chatBoxSettings.notify ?? false}
          onChange={(value) => update('notify', value)}
        />
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
