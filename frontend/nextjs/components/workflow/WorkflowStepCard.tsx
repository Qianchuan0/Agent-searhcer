'use client';

import { WorkflowStep, StepId } from '@/utils/workflowMapping';

const ICONS: Record<StepId, React.ReactNode> = {
  planning: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  retrieval: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  analysis: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  visualization: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
};

export default function WorkflowStepCard({ step }: { step: WorkflowStep }) {
  const { id, status, title, progress } = step;

  const iconColor =
    status === 'done'
      ? 'text-[var(--success)]'
      : status === 'running'
      ? 'text-primary'
      : 'text-ink-muted';

  return (
    <div
      className={`glass-card relative flex-1 min-w-[130px] p-3 transition-all ${
        status === 'running' ? 'glow-border' : ''
      } ${status === 'pending' ? 'opacity-50' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={iconColor}>{ICONS[id]}</span>
        <span className="text-xs font-medium text-ink">{title}</span>
        <span className="ml-auto">
          {status === 'done' && (
            <svg className="h-4 w-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {status === 'running' && (
            <span className="loader">
              <span />
              <span />
              <span />
            </span>
          )}
        </span>
      </div>

      {/* 进度条 */}
      {status === 'pending' ? (
        <div className="h-1 rounded-full bg-white/5" />
      ) : (
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-gradient transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === 'running' && (
        <span className="mt-1.5 block text-[10px] text-primary">{progress}%</span>
      )}
    </div>
  );
}
