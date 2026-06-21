'use client';

export default function UserCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(92,103,255,0.95),rgba(28,207,255,0.82))] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(42,92,255,0.35)]">
            AI
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#121212] bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">研究助手</p>
          <p className="truncate text-xs text-ink-muted">本地工作区在线</p>
        </div>
      </div>
    </div>
  );
}
