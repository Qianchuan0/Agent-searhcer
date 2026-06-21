'use client';

import { useEffect, useState } from 'react';
import { useResearchStore } from '@/stores/researchStore';
import { computeWorkflowSteps } from '@/utils/workflowMapping';
import { getLatestStatusMessage } from '@/utils/researchStatus';
import { translateAgentLogText } from '@/utils/uiLabels';

export default function WorkflowPanel() {
  const orderedData = useResearchStore((s) => s.orderedData);
  const allLogs = useResearchStore((s) => s.allLogs);
  const loading = useResearchStore((s) => s.loading);

  const steps = computeWorkflowSteps(orderedData);
  const latestStatus = translateAgentLogText(getLatestStatusMessage(allLogs));
  const recentLogs = allLogs.slice(-8).reverse();
  const [displayProgress, setDisplayProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setDisplayProgress((prev) => {
      const next: Record<string, number> = {};

      steps.forEach((step) => {
        if (step.status === 'done') {
          next[step.id] = 100;
          return;
        }

        if (step.status === 'running') {
          const seededProgress = Math.max(step.progress, prev[step.id] ?? 12);
          next[step.id] = Math.min(seededProgress, 90);
          return;
        }

        next[step.id] = 0;
      });

      return next;
    });
  }, [steps]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = window.setInterval(() => {
      setDisplayProgress((prev) => {
        const next = { ...prev };
        let changed = false;

        steps.forEach((step) => {
          const currentValue = next[step.id] ?? 0;

          if (step.status === 'done' && currentValue !== 100) {
            next[step.id] = 100;
            changed = true;
            return;
          }

          if (step.status !== 'running') {
            return;
          }

          if (currentValue >= 90) {
            return;
          }

          const increment = currentValue < 30 ? 6 : currentValue < 55 ? 4 : currentValue < 75 ? 2 : 1;
          next[step.id] = Math.min(currentValue + increment, 90);
          changed = true;
        });

        return changed ? next : prev;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [loading, steps]);

  return (
    <section className="min-h-full px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
            Workflow
          </p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">执行流程</h2>
              <p className="mt-2 text-sm text-ink-muted">集中查看研究任务当前所处阶段和最近的执行反馈。</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Status</p>
              <p className="mt-1 text-sm font-medium text-white">{loading ? latestStatus : '当前没有进行中的研究任务'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const accent =
              step.status === 'done'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                : step.status === 'running'
                  ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
                  : 'border-white/10 bg-white/[0.04] text-ink-muted';

            return (
              <div
                key={step.id}
                className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Step {index + 1}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] ${accent}`}>
                    {step.status === 'done' ? '完成' : step.status === 'running' ? '进行中' : '等待中'}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      step.status === 'done'
                        ? 'bg-emerald-400'
                        : step.status === 'running'
                          ? 'bg-cyan-300'
                          : 'bg-white/10'
                    }`}
                    style={{ width: `${displayProgress[step.id] ?? step.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-ink-muted">{Math.round(displayProgress[step.id] ?? step.progress)}%</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">最近日志</h3>
              <p className="mt-1 text-sm text-ink-muted">用于快速查看最近几步执行反馈。</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink-muted">
              {recentLogs.length}
            </span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center text-sm text-ink-muted">
              还没有可展示的执行日志。
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentLogs.map((log, index) => (
                <div
                  key={`${log.header}-${index}`}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-white">{translateAgentLogText(log.text || '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
