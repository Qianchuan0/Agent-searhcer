'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useResearchHistoryContext } from '@/hooks/ResearchHistoryContext';
import { useResearchStore } from '@/stores/researchStore';
import NavMenu from './NavMenu';
import UserCard from './UserCard';

/** 左导航：Logo + 新研究按钮 + 主菜单 + 研究历史 + 用户卡片 */
export default function LeftNav() {
  const router = useRouter();
  const { history, deleteResearch } = useResearchHistoryContext();
  const reset = useResearchStore((s) => s.reset);

  const handleNewResearch = () => {
    reset();
    router.push('/');
  };

  const formatTs = (ts?: number | string) => {
    if (!ts) return '';
    try {
      return formatDistanceToNow(new Date(ts), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-gradient flex items-center justify-center shadow-glow-primary">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">AI Research</p>
          <p className="text-[10px] text-ink-muted">Research Agent</p>
        </div>
      </div>

      {/* 新研究按钮 */}
      <div className="px-3 pb-3">
        <button type="button" onClick={handleNewResearch} className="neon-btn w-full py-2.5 text-sm font-medium">
          <span className="inline-flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            新研究
          </span>
        </button>
      </div>

      {/* 主菜单 */}
      <div className="px-3 pb-3">
        <NavMenu />
      </div>

      {/* 历史列表 */}
      <div className="flex-1 min-h-0 flex flex-col px-3">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          研究历史
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5">
          {history.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-xs text-ink-muted">暂无研究历史</p>
              <p className="text-[11px] text-ink-muted mt-1">开始第一次研究</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/research/${item.id}`)}
                  className="block w-full text-left px-3 py-2.5 pr-8"
                >
                  <p className="text-xs font-medium text-ink-secondary group-hover:text-ink truncate">
                    {item.question}
                  </p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{formatTs(item.timestamp)}</p>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteResearch(item.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded text-ink-muted opacity-0 group-hover:opacity-100 hover:text-error hover:bg-white/5 transition"
                  aria-label="删除研究"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 用户卡片 */}
      <div className="p-3 border-t border-[var(--border)]">
        <UserCard />
      </div>
    </div>
  );
}
