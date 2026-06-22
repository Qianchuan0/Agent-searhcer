'use client';

import { useResearchStore, ActiveNav } from '@/stores/researchStore';

interface NavItemDef {
  key: ActiveNav;
  label: string;
  helper: string;
  icon: React.ReactNode;
}

const ITEMS: NavItemDef[] = [
  {
    key: 'home',
    label: '研究首页',
    helper: '发起新问题',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75v9A1.5 1.5 0 006.75 20.25h10.5a1.5 1.5 0 001.5-1.5v-9" />
      </svg>
    ),
  },
  {
    key: 'conversations',
    label: '历史记录',
    helper: '查看研究历史',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m7.125-1.5c0 3.728-3.694 6.75-8.25 6.75a9.77 9.77 0 01-2.943-.443L3.75 19.5l1.302-3.038A6.706 6.706 0 013.75 11.25c0-3.728 3.694-6.75 8.25-6.75s8.25 3.022 8.25 6.75z" />
      </svg>
    ),
  },
  {
    key: 'workflow',
    label: '执行流程',
    helper: '追踪研究进度',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h9M7.5 12h5.25M7.5 17.25h9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h.008v.008H4.5V6.75zm0 5.25h.008v.008H4.5V12zm0 5.25h.008v.008H4.5v-.008z" />
      </svg>
    ),
  },
  {
    key: 'resources',
    label: '资料来源',
    helper: '管理引用材料',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-7.5A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h7.5M8.25 12h7.5M8.25 15.75h4.5" />
      </svg>
    ),
  },
  {
    key: 'memory',
    label: '长期记忆',
    helper: '管理跨研究记忆',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75V8.625A3.375 3.375 0 0111.625 5.25h.75A3.375 3.375 0 0115.75 8.625V9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9.75h10.5v7.125A1.875 1.875 0 0115.375 18.75H8.625A1.875 1.875 0 016.75 16.875V9.75z" />
      </svg>
    ),
  },
  {
    key: 'help',
    label: '使用帮助',
    helper: '查看说明',
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 115.82 1c0 2-3 2-3 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

export default function NavMenu() {
  const activeNav = useResearchStore((s) => s.activeNav);
  const setActiveNav = useResearchStore((s) => s.setActiveNav);

  return (
    <nav className="space-y-1.5">
      {ITEMS.map((item) => {
        const isActive = activeNav === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveNav(item.key)}
            className={`nav-item nav-item-compact w-full text-left ${isActive ? 'active' : ''}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04]">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.label}</span>
              <span className="block truncate text-[11px] text-ink-muted">{item.helper}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
