import { useRef, useState, useEffect, useCallback } from 'react';
import { Data, ChatBoxSettings } from '../types/data';
import { getHost } from '../helpers/getHost';
import { LOCAL_RESEARCH_STATUS_MESSAGES, createStatusEvent } from '@/utils/researchStatus';

export const useWebSocket = (
  setOrderedData: React.Dispatch<React.SetStateAction<Data[]>>,
  setAnswer: React.Dispatch<React.SetStateAction<string>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShowHumanFeedback: React.Dispatch<React.SetStateAction<boolean>>,
  setQuestionForHuman: React.Dispatch<React.SetStateAction<boolean | true>>
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const heartbeatInterval = useRef<number>();
  const startupStatusTimeouts = useRef<number[]>([]);
  const hasReceivedMessage = useRef(false);
  const initStartedAt = useRef<number>(0);

  const clearStartupStatusTimeouts = () => {
    startupStatusTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
    startupStatusTimeouts.current = [];
  };

  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Component unmounted');
      }

      clearStartupStatusTimeouts();
    };
  }, [socket]);

  const startHeartbeat = (ws: WebSocket) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000);
  };

  const appendStatus = (output: string, metadata: Record<string, any> = {}) => {
    setOrderedData((prevOrder) => [
      ...prevOrder,
      createStatusEvent('planning_research', output, metadata),
    ]);
  };

  const initializeWebSocket = useCallback(
    (promptValue: string, chatBoxSettings: ChatBoxSettings) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'New connection requested');
      }

      hasReceivedMessage.current = false;
      initStartedAt.current = Date.now();
      clearStartupStatusTimeouts();

      if (typeof window === 'undefined') {
        return;
      }

      const fullHost = getHost();
      const protocol = fullHost.includes('https') ? 'wss:' : 'ws:';
      const cleanHost = fullHost.replace('http://', '').replace('https://', '');
      const wsUri = `${protocol}//${cleanHost}/ws`;

      const newSocket = new WebSocket(wsUri);
      setSocket(newSocket);

      startupStatusTimeouts.current = [
        window.setTimeout(() => {
          if (!hasReceivedMessage.current) {
            appendStatus(LOCAL_RESEARCH_STATUS_MESSAGES.delayed, { source: 'client' });
          }
        }, 8000),
        window.setTimeout(() => {
          if (!hasReceivedMessage.current) {
            appendStatus(LOCAL_RESEARCH_STATUS_MESSAGES.waiting, { source: 'client' });
          }
        }, 20000),
      ];

      newSocket.onopen = () => {
        const elapsed = Date.now() - initStartedAt.current;
        const minimumDelay = 1400;
        const revealDelay = Math.max(0, minimumDelay - elapsed);

        window.setTimeout(() => {
          appendStatus(LOCAL_RESEARCH_STATUS_MESSAGES.connected, { source: 'client' });
        }, revealDelay);

        const domainFilters = JSON.parse(localStorage.getItem('domainFilters') || '[]');
        const domains = domainFilters ? domainFilters.map((domain: any) => domain.value) : [];
        const { report_type, report_source, tone, mcp_enabled, mcp_configs, mcp_strategy } =
          chatBoxSettings;

        try {
          const dataToSend = {
            task: promptValue,
            report_type,
            report_source,
            tone,
            query_domains: domains,
            mcp_enabled: mcp_enabled || false,
            mcp_strategy: mcp_strategy || 'fast',
            mcp_configs: mcp_configs || [],
          };

          newSocket.send(`start ${JSON.stringify(dataToSend)}`);
        } catch (error) {
          console.error('Error preparing start message:', error);
        }

        startHeartbeat(newSocket);
      };

      newSocket.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            return;
          }

          hasReceivedMessage.current = true;
          clearStartupStatusTimeouts();

          const data = JSON.parse(event.data);

          if (data.type === 'error') {
            console.error(`Server error: ${data.output}`);
          } else if (data.type === 'human_feedback' && data.content === 'request') {
            setQuestionForHuman(data.output);
            setShowHumanFeedback(true);
          } else {
            const contentAndType = `${data.content}-${data.type}`;
            setOrderedData((prevOrder) => [...prevOrder, { ...data, contentAndType }]);

            if (data.type === 'report') {
              setAnswer((prev: string) => prev + data.output);
            } else if (data.type === 'report_complete') {
              setAnswer(data.output);
            } else if (data.type === 'path') {
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      newSocket.onclose = () => {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        clearStartupStatusTimeouts();
        setSocket(null);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        clearStartupStatusTimeouts();
        setOrderedData((prevOrder) => [
          ...prevOrder,
          createStatusEvent('error', LOCAL_RESEARCH_STATUS_MESSAGES.connectionFailed, {
            source: 'client',
          }),
        ]);
        setLoading(false);
      };
    },
    [socket, setOrderedData, setAnswer, setLoading, setShowHumanFeedback, setQuestionForHuman]
  );

  return { socket, setSocket, initializeWebSocket };
};
