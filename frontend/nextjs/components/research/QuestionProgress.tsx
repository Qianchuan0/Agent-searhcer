'use client';

import { Data } from '@/types/data';
import { computeQuestionProgress } from '@/utils/questionProgress';

interface QuestionProgressProps {
  orderedData: Data[];
  handleClickSuggestion?: (value: string) => void;
}

/**
 * 研究问题与进度：每个子问题一行（文本 + 百分比 + 进度条）。
 * 由 orderedData 的 subqueries 块推导；点击问题可触发建议填充。
 */
export default function QuestionProgress({ orderedData, handleClickSuggestion }: QuestionProgressProps) {
  const items = computeQuestionProgress(orderedData);
  if (items.length === 0) return null;

  return (
    <div className="glass-card my-4 space-y-3 p-5">
      <h3 className="text-sm font-semibold text-ink">研究问题与进度</h3>
      {items.map((q, i) => (
        <div
          key={i}
          className={`rounded-lg ${handleClickSuggestion ? 'cursor-pointer hover:bg-white/[0.03]' : ''} p-1.5 transition`}
          onClick={() => handleClickSuggestion?.(q.text)}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
                {i + 1}
              </span>
              <span className="truncate">{q.text}</span>
            </span>
            <span className={`text-[11px] font-medium ${q.done ? 'text-[var(--success)]' : 'text-primary'}`}>
              {q.progress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${q.done ? 'bg-[var(--success)]' : 'bg-indigo-gradient'}`}
              style={{ width: `${q.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
