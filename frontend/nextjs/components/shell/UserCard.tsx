'use client';

/** 左导航底部用户卡片：头像 + 在线状态绿点 + 用户名（占位） */
export default function UserCard() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-[var(--border)] bg-white/[0.02]">
      <div className="relative shrink-0">
        <div className="h-9 w-9 rounded-full bg-indigo-gradient flex items-center justify-center text-white text-sm font-semibold shadow-glow-primary">
          研
        </div>
        {/* 在线状态绿点 */}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[var(--success)] ring-2 ring-[var(--bg)]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink truncate">研究者</p>
        <p className="text-xs text-ink-muted truncate">在线</p>
      </div>
    </div>
  );
}
