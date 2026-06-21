import LogMessage from './elements/LogMessage';
import { useEffect, useRef } from 'react';
import { getLatestStatusMessage } from '@/utils/researchStatus';

interface Log {
  header: string;
  text: string;
  metadata: any;
  key: string;
}

interface OrderedLogsProps {
  logs: Log[];
  loading?: boolean;
}

const LogsSection = ({ logs, loading = false }: OrderedLogsProps) => {
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const latestStatusMessage = getLatestStatusMessage(logs);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, loading]);

  return (
    <div className="container mt-5 h-auto w-full shrink-0 rounded-lg border border-solid border-gray-700/40 bg-black/30 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-start gap-4 pb-3 lg:pb-3.5">
        <img src="/img/chat-check.svg" alt="logs" width={24} height={24} />
        <h3 className="text-base font-bold uppercase leading-[152.5%] text-white">
          智能体工作过程
        </h3>
      </div>
      <div
        ref={logsContainerRef}
        className="min-h-[200px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300/10"
      >
        <LogMessage logs={logs} loading={loading} latestStatusMessage={latestStatusMessage} />
      </div>
    </div>
  );
};

export default LogsSection;
