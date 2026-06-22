import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { markdownToHtml } from "../../helpers/markdownHelper";
import "../../styles/markdown.css";
import { ReportMemoryResponse, ResearchFinding } from "../../types/data";

function HistoricalReferences({ researchId }: { researchId?: string }) {
  const [reportMemory, setReportMemory] = useState<ReportMemoryResponse | null>(null);

  useEffect(() => {
    if (!researchId) {
      setReportMemory(null);
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/reports/${researchId}/memory`);
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as ReportMemoryResponse;
        setReportMemory(data);
      } catch (error) {
        console.error("Error loading report memory:", error);
      }
    };

    void load();
  }, [researchId]);

  const newFindings = useMemo(() => {
    const raw = reportMemory?.metadata?.new_findings;
    return Array.isArray(raw) ? (raw as ResearchFinding[]) : [];
  }, [reportMemory]);

  if (!reportMemory?.findings?.length && !newFindings.length) {
    return null;
  }

  return (
    <div className="mb-5 space-y-4">
      {!!reportMemory?.findings?.length && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            历史研究引用
          </p>
          <p className="mt-2 text-sm leading-6 text-white/85">
            这里展示的是本次研究开始前，你明确选择承接的旧结论。报告正文应把这些内容视为历史上下文，而不是本次新发现。
          </p>

          <div className="mt-4 space-y-3">
            {reportMemory.findings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-xl border border-white/10 bg-black/15 px-4 py-3"
              >
                <p className="text-sm font-medium text-white">{finding.claim}</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  来源报告：{finding.source_report_id} | 可信度：{finding.confidence} | 时效性：
                  {finding.staleness}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-secondary">
                  {finding.evidence_summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!newFindings.length && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            本次新增发现
          </p>
          <p className="mt-2 text-sm leading-6 text-white/85">
            这里列出的是当前报告沉淀出的新结论摘要，便于和上方承接的旧结论区分。
          </p>

          <div className="mt-4 space-y-3">
            {newFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-xl border border-white/10 bg-black/15 px-4 py-3"
              >
                <p className="text-sm font-medium text-white">{finding.claim}</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  当前报告：{researchId} | 可信度：{finding.confidence} | 时效性：
                  {finding.staleness}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-secondary">
                  {finding.evidence_summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Report({
  answer,
  researchId,
}: {
  answer: string;
  researchId?: string;
}) {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (answer) {
      markdownToHtml(answer).then((html) => setHtmlContent(html));
    }
  }, [answer]);

  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 rounded-lg border border-solid border-gray-700/40 bg-black/30 p-5 shadow-lg backdrop-blur-md">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-300"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-primary-300">Research Report</h3>
          </div>
          {answer && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer.trim());
                  toast("Report copied to clipboard", { icon: "✓" });
                }}
                className="transition-opacity duration-200 hover:opacity-80"
              >
                <img
                  src="/img/copy-white.svg"
                  alt="copy"
                  width={20}
                  height={20}
                  className="cursor-pointer text-white"
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap content-center items-center gap-[15px] pl-5 pr-5">
          <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-white log-message">
            {answer ? (
              <>
                <HistoricalReferences researchId={researchId} />
                <div
                  className="markdown-content prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[85%] animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[90%] animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[70%] animate-pulse rounded-md bg-gray-300/20" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
