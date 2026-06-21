import React from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import TripleLayout from '@/components/layouts/TripleLayout';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ChatBoxSettings } from '@/types/data';

interface LayoutProps {
  children: React.ReactNode;
  loading: boolean;
  isStopped: boolean;
  showResult: boolean;
  onStop?: () => void;
  onNewResearch?: () => void;
  chatBoxSettings: ChatBoxSettings;
  setChatBoxSettings: React.Dispatch<React.SetStateAction<ChatBoxSettings>>;
  mainContentRef?: React.RefObject<HTMLDivElement>;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
  toastOptions?: Record<string, any>;
  toggleSidebar?: () => void;
  isProcessingChat?: boolean;
}

/**
 * 根据屏幕宽度选择布局：移动端走 MobileLayout，桌面端统一走三栏 TripleLayout。
 * （原 copilot/standard 桌面分支已由三栏布局取代）
 */
export const getAppropriateLayout = ({
  children,
  loading,
  isStopped,
  showResult,
  onStop,
  onNewResearch,
  chatBoxSettings,
  setChatBoxSettings,
  mainContentRef,
  showScrollButton = false,
  onScrollToBottom,
  toastOptions = {},
  toggleSidebar,
  isProcessingChat = false,
}: LayoutProps) => {
  const isMobile = useIsMobile();

  // 移动端
  if (isMobile) {
    return (
      <MobileLayout
        loading={loading}
        isStopped={isStopped}
        showResult={showResult}
        onStop={onStop}
        onNewResearch={onNewResearch}
        chatBoxSettings={chatBoxSettings}
        setChatBoxSettings={setChatBoxSettings}
        mainContentRef={mainContentRef}
        toastOptions={toastOptions}
        toggleSidebar={toggleSidebar}
      >
        {children}
      </MobileLayout>
    );
  }

  // 桌面端：三栏布局
  return (
    <TripleLayout
      loading={loading}
      isStopped={isStopped}
      showResult={showResult}
      onStop={onStop}
      onNewResearch={onNewResearch}
      mainContentRef={mainContentRef}
    >
      {children}
    </TripleLayout>
  );
};
