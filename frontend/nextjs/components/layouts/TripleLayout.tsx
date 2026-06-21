'use client';

import { Toaster } from 'react-hot-toast';
import { useResearchStore } from '@/stores/researchStore';
import AppShell from './AppShell';
import HistoryPanel from '@/components/shell/HistoryPanel';
import WorkflowPanel from '@/components/shell/WorkflowPanel';
import SourcesPanel from '@/components/shell/SourcesPanel';
import HelpPanel from '@/components/shell/HelpPanel';

interface TripleLayoutProps {
  children: React.ReactNode;
  mainContentRef?: React.RefObject<HTMLDivElement>;
  loading?: boolean;
  isStopped?: boolean;
  showResult?: boolean;
  onStop?: () => void;
  onNewResearch?: () => void;
}

/**
 * 桌面三栏布局入口：AppShell + 中栏顶部工具栏 + 滚动内容区。
 * 顶部工具栏承接旧 Header 的 Stop/New 操作与 Inspector 折叠切换。
 */
export default function TripleLayout({
  children,
  mainContentRef,
  loading,
  isStopped,
  showResult,
  onStop,
  onNewResearch,
}: TripleLayoutProps) {
  const activeNav = useResearchStore((s) => s.activeNav);
  const inspectorOpen = useResearchStore((s) => s.inspectorOpen);
  const setInspectorOpen = useResearchStore((s) => s.setInspectorOpen);
  const setActiveNav = useResearchStore((s) => s.setActiveNav);
  const titleMap = {
    home: showResult ? '研究工作区' : '开始新的研究',
    conversations: '历史记录',
    workflow: '执行流程',
    resources: '资料来源',
    help: '使用帮助',
  } as const;
  const middleContent =
    activeNav === 'conversations'
      ? <HistoryPanel />
      : activeNav === 'workflow'
        ? <WorkflowPanel />
        : activeNav === 'resources'
          ? <SourcesPanel />
          : activeNav === 'help'
            ? <HelpPanel />
            : children;

  const middle = (
    <>
      <Toaster position="bottom-center" />

      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3 glass-panel">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {titleMap[activeNav]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Inspector 折叠/展开切换 */}
          <button
            type="button"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="ghost-btn flex items-center gap-1.5 px-2.5 py-1.5"
            aria-label="切换设置面板"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* 停止按钮：研究进行中显示 */}
          {loading && !isStopped && (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center rounded-lg bg-error px-4 py-1.5 text-sm font-medium text-white shadow-md transition hover:opacity-90"
            >
              停止
            </button>
          )}

          {/* 新研究按钮：研究停止或完成后显示 */}
          {(isStopped || !loading) && showResult && (
            <button
              type="button"
              onClick={() => {
                setActiveNav('home');
                onNewResearch?.();
              }}
              className="neon-btn px-4 py-1.5 text-sm"
            >
              新研究
            </button>
          )}
        </div>
      </div>

      {/* 内容滚动区 */}
      <div ref={mainContentRef} className="app-scrollbar relative flex-1 overflow-y-auto">
        {middleContent}
      </div>
    </>
  );

  return <AppShell middle={middle} />;
}
