'use client';

import { useResearchStore } from '@/stores/researchStore';
import { preprocessOrderedData } from '@/utils/dataProcessing';

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export default function SourcesPanel() {
  const orderedData = useResearchStore((s) => s.orderedData);
  const groupedData = preprocessOrderedData(orderedData);
  const sourceBlocks = groupedData.filter((item: any) => item.type === 'sourceBlock');
  const sources = sourceBlocks.flatMap((block: any) => block.items || []);

  return (
    <section className="min-h-full px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                Sources
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">资料来源</h2>
              <p className="mt-2 text-sm text-ink-muted">查看当前研究中已经抓取和引用过的来源链接。</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">{sources.length}</p>
            </div>
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">当前还没有来源数据</p>
            <p className="mt-2 text-sm text-ink-muted">开始一次研究并抓取资料后，这里会自动汇总来源链接。</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sources.map((source: { name: string; url: string }, index: number) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[24px] border border-white/8 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    Source
                  </span>
                  <svg className="h-4 w-4 text-ink-muted transition group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h3.75A1.5 1.5 0 0112 9v8.25a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V9a1.5 1.5 0 011.5-1.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{source.name || getHostname(source.url)}</h3>
                <p className="mt-2 text-sm text-cyan-200/85">{getHostname(source.url)}</p>
                <p className="mt-3 line-clamp-3 break-all text-sm leading-6 text-ink-muted">{source.url}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
