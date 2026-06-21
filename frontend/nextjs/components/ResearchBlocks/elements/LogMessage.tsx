import Accordion from '../../Task/Accordion';
import { useEffect, useState } from 'react';
import { markdownToHtml } from '../../../helpers/markdownHelper';
import { translateAgentLogText } from '@/utils/uiLabels';

type ProcessedData = {
  field: string;
  htmlContent: string;
  isMarkdown: boolean;
};

type Log = {
  header: string;
  text: string;
  processedData?: ProcessedData[];
  metadata?: any;
};

interface LogMessageProps {
  logs: Log[];
  loading?: boolean;
  latestStatusMessage?: string;
}

const LogMessage: React.FC<LogMessageProps> = ({
  logs,
  loading = false,
  latestStatusMessage = '正在研究中...',
}) => {
  const [processedLogs, setProcessedLogs] = useState<Log[]>([]);

  useEffect(() => {
    const processLogs = async () => {
      if (!logs) {
        return;
      }

      const newLogs = await Promise.all(
        logs.map(async (log) => {
          try {
            if (log.header === 'differences' && log.text) {
              const data = JSON.parse(log.text).data;
              const processedData = await Promise.all(
                Object.keys(data).map(async (field) => {
                  const fieldValue = data[field].after || data[field].before;
                  if (!plainTextFields.includes(field)) {
                    const htmlContent = await markdownToHtml(fieldValue);
                    return { field, htmlContent, isMarkdown: true };
                  }
                  return { field, htmlContent: fieldValue, isMarkdown: false };
                })
              );
              return { ...log, processedData };
            }
            return log;
          } catch (error) {
            console.error('Error processing log:', error);
            return log;
          }
        })
      );
      setProcessedLogs(newLogs);
    };

    processLogs();
  }, [logs]);

  return (
    <>
      {processedLogs.map((log, index) => {
        if (log.header === 'subquery_context_window' || log.header === 'differences') {
          return <Accordion key={index} logs={[log]} />;
        }

        if (log.header === 'selected_images' || log.header === 'scraping_images') {
          return null;
        }

        const translatedText = translateAgentLogText(log.text);
        const isClientStatus = log.metadata?.source === 'client';

        return (
          <div
            key={index}
            className={`mx-auto mt-3 w-full max-w-4xl rounded-xl border px-4 py-3 shadow-md animate-log-enter ${
              isClientStatus
                ? 'border-primary/35 bg-primary/10'
                : 'border-gray-700/60 bg-gray-900'
            }`}
            style={{ animationDelay: `${Math.min(index * 80, 320)}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  isClientStatus ? 'bg-primary shadow-[0_0_12px_rgba(91,91,255,0.45)]' : 'bg-cyan-400/80'
                }`}
              />
              <p className="text-base leading-relaxed text-white">{translatedText}</p>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="mx-auto mt-3 w-full max-w-4xl rounded-2xl border border-primary/30 bg-gray-900/95 px-4 py-4 shadow-lg animate-log-enter">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-log-pulse [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-log-pulse [animation-delay:180ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-log-pulse [animation-delay:360ms]" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{translateAgentLogText(latestStatusMessage)}</p>
              <p className="mt-1 text-xs text-gray-400">正在持续收集资料并整理研究结果。</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes log-enter {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes log-pulse {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        .animate-log-enter {
          animation: log-enter 0.34s ease-out both;
        }

        .animate-log-pulse {
          animation: log-pulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

const plainTextFields = ['task', 'sections', 'headers', 'sources', 'research_data'];

export default LogMessage;
