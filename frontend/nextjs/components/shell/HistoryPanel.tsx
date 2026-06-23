'use client';

import { usePathname, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useResearchHistoryContext } from '@/hooks/ResearchHistoryContext';

export default function HistoryPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { history, deleteResearch } = useResearchHistoryContext();

  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const formatTs = (ts?: number | string) => {
    if (!ts) {
      return '';
    }

    try {
      return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN });
    } catch {
      return '';
    }
  };

  const openResearch = (id: string) => {
    router.push(`/research/${id}`);
  };

  return (
    <section className="min-h-full px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                History
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">研究历史记录</h2>
              <p className="mt-2 text-sm text-ink-muted">
                这里集中查看之前保存的研究任务、时间和对应结果。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">{sortedHistory.length}</p>
            </div>
          </div>

          <div className="mt-6">
            {sortedHistory.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-ink-muted">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-7.5A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V16.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h7.5M8.25 12h7.5M8.25 15.75h4.5" />
                  </svg>
                </div>
                <p className="mt-4 text-lg font-medium text-white">还没有研究记录</p>
                <p className="mt-2 text-sm text-ink-muted">开始一次新研究后，这里会自动出现历史条目。</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedHistory.map((item) => {
                  const isActive = pathname === `/research/${item.id}`;

                  return (
                    <article
                      key={item.id}
                      className={`group relative overflow-hidden rounded-[24px] border transition-all ${
                        isActive
                          ? 'border-cyan-400/35 bg-[linear-gradient(180deg,rgba(10,36,57,0.94),rgba(17,24,39,0.92))] shadow-[0_18px_50px_rgba(0,115,255,0.16)]'
                          : 'border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.8),transparent)]" />
                      )}

                      <button
                        type="button"
                        onClick={() => openResearch(item.id)}
                        className="block w-full px-5 pb-5 pt-5 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink-muted">
                            {formatTs(item.timestamp)}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-200">
                              当前打开
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-6 text-white">
                          {item.question}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-muted">
                          {item.answer?.replace(/[#>*`-]/g, ' ').replace(/\s+/g, ' ').trim() || '暂无摘要内容'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteResearch(item.id);
                        }}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-transparent text-ink-muted opacity-0 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-rose-300 group-hover:opacity-100"
                        aria-label="删除研究记录"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
