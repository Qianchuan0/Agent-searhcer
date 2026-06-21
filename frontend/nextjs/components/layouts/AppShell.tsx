'use client';

import { useResearchStore } from '@/stores/researchStore';
import LeftNav from '@/components/shell/LeftNav';
import Inspector from '@/components/shell/Inspector';

interface AppShellProps {
  /** 中栏内容（由 TripleLayout 组装：顶部工具栏 + 滚动内容） */
  middle?: React.ReactNode;
}

/**
 * 三栏应用外壳：左导航（240px）+ 中栏（1fr）+ 右设置面板（320px，可折叠）。
 * 左右栏自包含（直接渲染 LeftNav / Inspector），中栏由调用方通过 middle slot 注入。
 */
export default function AppShell({ middle }: AppShellProps) {
  const inspectorOpen = useResearchStore((s) => s.inspectorOpen);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface text-ink">
      {/* 左导航 */}
      <aside className="w-[240px] shrink-0 border-r border-[var(--border)] glass-panel">
        <LeftNav />
      </aside>

      {/* 中栏 */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{middle}</main>

      {/* 右设置面板（可折叠） */}
      <aside
        className={`shrink-0 overflow-hidden border-l border-[var(--border)] transition-all duration-300 ${
          inspectorOpen ? 'w-[320px]' : 'w-0 border-l-0'
        }`}
      >
        {inspectorOpen && <Inspector />}
      </aside>
    </div>
  );
}
