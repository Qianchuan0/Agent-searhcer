'use client';

import { useResearchStore } from '@/stores/researchStore';
import InspectorControls from './InspectorControls';

export default function Inspector() {
  const setInspectorOpen = useResearchStore((state) => state.setInspectorOpen);

  return (
    <div className="flex h-full flex-col glass-panel">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">研究设置</h2>
        <button
          type="button"
          onClick={() => setInspectorOpen(false)}
          className="ghost-btn px-2 py-1"
          aria-label="收起设置面板"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <InspectorControls />
      </div>
    </div>
  );
}
