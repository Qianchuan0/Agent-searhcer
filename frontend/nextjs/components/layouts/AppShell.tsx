'use client';

import { useResearchStore } from '@/stores/researchStore';
import LeftNav from '@/components/shell/LeftNav';
import Inspector from '@/components/shell/Inspector';

interface AppShellProps {
  middle?: React.ReactNode;
}

export default function AppShell({ middle }: AppShellProps) {
  const inspectorOpen = useResearchStore((s) => s.inspectorOpen);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface text-ink">
      <aside className="relative w-[284px] shrink-0 border-r border-white/8 bg-black/25 backdrop-blur-2xl">
        <div className="absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)]" />
        <LeftNav />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{middle}</main>

      <aside
        className={`shrink-0 overflow-hidden border-l border-white/8 bg-black/20 backdrop-blur-2xl transition-all duration-300 ${
          inspectorOpen ? 'w-[320px]' : 'w-0 border-l-0'
        }`}
      >
        {inspectorOpen && <Inspector />}
      </aside>
    </div>
  );
}
