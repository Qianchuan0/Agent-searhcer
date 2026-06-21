import { Data } from '@/types/data';

export interface QuestionProgressItem {
  text: string;
  progress: number;
  done: boolean;
}

/**
 * 从 orderedData 的 subqueries 块提取子问题，并按已收集来源数估算每问进度。
 * subqueries.metadata 兼容 string[] 或 {question/text: string}[] 两种结构。
 */
export function computeQuestionProgress(orderedData: Data[]): QuestionProgressItem[] {
  const subq = (orderedData as any[]).find((d) => d.content === 'subqueries');
  const raw: any[] = subq?.metadata || [];
  if (raw.length === 0) return [];

  const questions: string[] = raw.map((q: any) =>
    typeof q === 'string' ? q : q?.question || q?.text || ''
  ).filter(Boolean);
  if (questions.length === 0) return [];

  const researchDone = (orderedData as any[]).some((d) => d.type === 'path');
  const sourceCount = (orderedData as any[]).filter(
    (d) => d.content === 'added_source_url'
  ).length;
  const per = Math.floor((sourceCount / Math.max(1, questions.length)) * 100);

  return questions.map((text, i) => ({
    text,
    progress: researchDone ? 100 : Math.min(95, per * (i + 1)),
    done: researchDone,
  }));
}
