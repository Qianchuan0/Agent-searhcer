'use client';

import { Data } from '@/types/data';
import { computeWorkflowSteps } from '@/utils/workflowMapping';
import WorkflowStepCard from './WorkflowStepCard';

interface WorkflowStepperProps {
  orderedData: Data[];
}

/**
 * 研究任务流程：4 个横向步骤卡片。
 * 由 orderedData 经 computeWorkflowSteps 推导状态，无需额外 action。
 */
export default function WorkflowStepper({ orderedData }: WorkflowStepperProps) {
  const steps = computeWorkflowSteps(orderedData);
  const hasStarted = steps.some((s) => s.status !== 'pending');
  if (!hasStarted) return null;

  return (
    <div className="my-4">
      <h3 className="mb-3 text-sm font-semibold text-ink">研究任务流程</h3>
      <div className="flex flex-wrap gap-3">
        {steps.map((step) => (
          <WorkflowStepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
