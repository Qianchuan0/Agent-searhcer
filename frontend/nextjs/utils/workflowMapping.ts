import { Data } from '@/types/data';

export type StepStatus = 'pending' | 'running' | 'done';
export type StepId = 'planning' | 'retrieval' | 'analysis' | 'visualization';

export interface WorkflowStep {
  id: StepId;
  title: string;
  /** 设计图步骤图标色调 */
  status: StepStatus;
  /** 0-100，仅 running 态有意义 */
  progress: number;
}

/**
 * 研究阶段日志 content/type → 工作流步骤的映射表。
 * 取值依据：utils/dataProcessing.ts 与 app/page.tsx 的 statusReports 实际观测。
 */
const STAGE_TO_STEP: Record<string, StepId> = {
  starting_research: 'planning',
  planning_research: 'planning',
  agent_generated: 'planning',
  subqueries: 'planning',
  researching: 'retrieval',
  scraping: 'retrieval',
  added_source_url: 'retrieval',
  research_report: 'analysis',
  report: 'analysis',
  report_complete: 'analysis',
  selected_images: 'visualization',
};

const STEP_ORDER: StepId[] = ['planning', 'retrieval', 'analysis', 'visualization'];

const TITLES: Record<StepId, string> = {
  planning: '规划研究',
  retrieval: '文献检索',
  analysis: '数据分析',
  visualization: '可视化展示',
};

/**
 * 由 orderedData 推导 4 个工作流步骤的状态。
 * 规则：touched 步骤中，最后 touched 且未收到结束信号(type==='path')= running；
 *       其前 = done；其后 = pending。研究结束后全部 done。
 */
export function computeWorkflowSteps(orderedData: Data[]): WorkflowStep[] {
  const touched = new Set<StepId>();
  let urlCount = 0;
  let hasReport = false;
  let researchDone = false;

  for (const d of orderedData as any[]) {
    const key = d.content ?? d.type;
    if (key === 'added_source_url') urlCount++;
    if (d.type === 'report' || d.type === 'report_complete' || d.content === 'research_report') {
      hasReport = true;
    }
    if (d.type === 'path') researchDone = true;
    const step = STAGE_TO_STEP[key];
    if (step) touched.add(step);
  }

  const touchedInOrder = STEP_ORDER.filter((s) => touched.has(s));
  const runningIdx = researchDone ? -1 : touchedInOrder.length - 1;

  return STEP_ORDER.map((id, idx) => {
    const isTouched = touched.has(id);
    let status: StepStatus;
    if (!isTouched) status = 'pending';
    else if (researchDone) status = 'done';
    else if (idx === runningIdx) status = 'running';
    else status = 'done';

    let progress = 0;
    if (status === 'done') progress = 100;
    else if (status === 'running') {
      if (id === 'retrieval') progress = Math.min(95, urlCount * 8);
      else if (id === 'analysis') progress = hasReport ? 80 : 40;
      else progress = 50;
    }

    return { id, title: TITLES[id], status, progress };
  });
}
