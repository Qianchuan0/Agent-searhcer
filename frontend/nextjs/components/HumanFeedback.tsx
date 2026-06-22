import React, { useEffect, useState } from 'react';
import { HumanReviewRequest } from '@/types/data';

interface HumanFeedbackProps {
  onFeedbackSubmit: (feedback: string | null) => void;
  questionForHuman: string | HumanReviewRequest | null;
  isSubmitting?: boolean;
}

const HumanFeedback: React.FC<HumanFeedbackProps> = ({
  questionForHuman,
  onFeedbackSubmit,
  isSubmitting = false,
}) => {
  const [userFeedback, setUserFeedback] = useState('');

  useEffect(() => {
    setUserFeedback('');
  }, [questionForHuman]);

  if (!questionForHuman) {
    return null;
  }

  const isStructuredPrompt = typeof questionForHuman !== 'string';
  const title = isStructuredPrompt ? questionForHuman.title : '需要人工确认';
  const message = isStructuredPrompt ? questionForHuman.message : questionForHuman;
  const sections = isStructuredPrompt ? questionForHuman.sections : [];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onFeedbackSubmit(userFeedback.trim() || null);
  };

  return (
    <div className="rounded-2xl border border-primary-500/30 bg-slate-950/80 p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]">
      <p className="text-xs uppercase tracking-[0.24em] text-primary-300/80">人工确认</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{message}</p>

      {sections.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white">当前研究大纲</p>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            {sections.map((section, index) => (
              <li key={`${section}-${index}`} className="flex gap-3">
                <span className="mt-0.5 text-primary-300">{index + 1}.</span>
                <span>{section}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-xl border border-white/10 bg-slate-900/80 p-3 text-sm text-white outline-none transition focus:border-primary-400/60"
          value={userFeedback}
          onChange={(e) => setUserFeedback(e.target.value)}
          placeholder="例如：加上第三季度财报数据，并单独列一节对比分析"
          disabled={isSubmitting}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onFeedbackSubmit(null)}
            disabled={isSubmitting}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            通过并继续
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !userFeedback.trim()}
            className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            提交修改意见
          </button>
        </div>
      </form>
    </div>
  );
};

export default HumanFeedback;
