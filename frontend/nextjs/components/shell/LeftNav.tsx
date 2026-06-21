'use client';

import { useRouter } from 'next/navigation';
import { useResearchStore } from '@/stores/researchStore';
import NavMenu from './NavMenu';
import UserCard from './UserCard';

export default function LeftNav() {
  const router = useRouter();
  const reset = useResearchStore((s) => s.reset);
  const setActiveNav = useResearchStore((s) => s.setActiveNav);

  const handleNewResearch = () => {
    reset();
    setActiveNav('home');
    router.push('/');
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-40 rounded-full bg-[radial-gradient(circle_at_top,rgba(26,158,255,0.22),transparent_72%)] blur-3xl" />

      <div className="relative flex items-start justify-between gap-3 px-5 pb-4 pt-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(79,91,255,0.95),rgba(24,196,226,0.9))] text-white shadow-[0_18px_40px_rgba(31,78,255,0.32)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4.5m0 9V21m9-9h-4.5M7.5 12H3m15.364 6.364l-3.182-3.182M10.818 8.818L7.636 5.636m10.728 0l-3.182 3.182m-4.364 6.364l-3.182 3.182" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
                Research
              </p>
              <h2 className="truncate text-xl font-semibold text-white">智能研究台</h2>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            管理研究任务、过程记录和历史结论。
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          已连接
        </span>
      </div>

      <div className="relative px-4 pb-4">
        <button
          type="button"
          onClick={handleNewResearch}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(56,69,190,0.95),rgba(24,153,209,0.92))] px-4 py-3 text-left text-white shadow-[0_18px_45px_rgba(24,96,209,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(24,96,209,0.3)]"
        >
          <span>
            <span className="block text-sm font-semibold">新建研究</span>
            <span className="mt-0.5 block text-xs text-cyan-100/75">开始一个新的研究问题</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        </button>
      </div>

      <div className="relative px-4 pb-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-2">
          <NavMenu />
        </div>
      </div>

      <div className="mt-auto relative border-t border-white/8 px-4 pb-4 pt-3">
        <UserCard />
      </div>
    </div>
  );
}
