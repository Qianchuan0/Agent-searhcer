import { useRef, Dispatch, SetStateAction } from "react";
import { ResearchResults } from "@/components/ResearchResults";
import InputArea from "@/components/ResearchBlocks/elements/InputArea";
import ChatInput from "@/components/ResearchBlocks/elements/ChatInput";
import LoadingDots from "@/components/LoadingDots";
import HumanFeedback from "@/components/HumanFeedback";
import ResearchClarification from "@/components/research/ResearchClarification";
import ResearchMemoryBridge from "@/components/research/ResearchMemoryBridge";
import MemorySuggestionPanel from "@/components/research/MemorySuggestionPanel";
import {
  ChatBoxSettings,
  ClarificationPayload,
  Data,
  HumanReviewRequest,
  MemorySuggestion,
  ResearchClassificationResponse,
} from "@/types/data";
import { getLatestStatusMessage } from "@/utils/researchStatus";

interface ResearchContentProps {
  showResult: boolean;
  orderedData: Data[];
  answer: string;
  allLogs: any[];
  chatBoxSettings: ChatBoxSettings;
  loading: boolean;
  isInChatMode: boolean;
  isStopped: boolean;
  promptValue: string;
  chatPromptValue: string;
  setPromptValue: Dispatch<SetStateAction<string>>;
  setChatPromptValue: Dispatch<SetStateAction<string>>;
  handleDisplayResult: (question: string) => void;
  handleChat: (message: string) => void;
  handleClickSuggestion: (value: string) => void;
  clarificationPayload?: ClarificationPayload | null;
  onSkipClarification?: () => void;
  onSubmitClarification?: (result: {
    selections: Record<string, string[]>;
    note: string;
  }) => void;
  isClarificationLoading?: boolean;
  showHumanFeedback?: boolean;
  questionForHuman?: string | HumanReviewRequest | null;
  handleFeedbackSubmit?: (feedback: string | null) => void;
  isSubmittingHumanFeedback?: boolean;
  currentResearchId?: string;
  onShareClick?: () => void;
  reset?: () => void;
  isProcessingChat?: boolean;
  bottomRef?: React.RefObject<HTMLDivElement>;
  memorySuggestions?: MemorySuggestion[];
  onSaveMemorySuggestion?: (suggestion: MemorySuggestion) => void;
  onDismissMemorySuggestion?: (suggestionId: string) => void;
  onDismissAllMemorySuggestions?: () => void;
  savingMemorySuggestionId?: string | null;
  pendingMemoryBridge?: ResearchClassificationResponse | null;
  onUseMemoryBridge?: () => void;
  onSkipMemoryBridge?: () => void;
}

export default function ResearchContent({
  showResult,
  orderedData,
  answer,
  allLogs,
  chatBoxSettings,
  loading,
  isInChatMode,
  isStopped,
  promptValue,
  chatPromptValue,
  setPromptValue,
  setChatPromptValue,
  handleDisplayResult,
  handleChat,
  handleClickSuggestion,
  clarificationPayload = null,
  onSkipClarification,
  onSubmitClarification,
  isClarificationLoading = false,
  showHumanFeedback = false,
  questionForHuman = null,
  handleFeedbackSubmit,
  isSubmittingHumanFeedback = false,
  currentResearchId,
  onShareClick,
  reset,
  isProcessingChat = false,
  bottomRef,
  memorySuggestions = [],
  onSaveMemorySuggestion,
  onDismissMemorySuggestion,
  onDismissAllMemorySuggestions,
  savingMemorySuggestionId = null,
  pendingMemoryBridge = null,
  onUseMemoryBridge,
  onSkipMemoryBridge,
}: ResearchContentProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const internalBottomRef = useRef<HTMLDivElement>(null);
  const finalBottomRef = bottomRef || internalBottomRef;
  const latestStatusMessage = getLatestStatusMessage(allLogs);

  return (
    <div className="flex h-full w-full grow flex-col justify-between">
      <div className="container w-full space-y-4">
        {onShareClick && currentResearchId && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={onShareClick}
              className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        )}

        <div className="container space-y-2 task-components">
          <ResearchResults
            orderedData={orderedData}
            answer={answer}
            allLogs={allLogs}
            chatBoxSettings={chatBoxSettings}
            handleClickSuggestion={handleClickSuggestion}
            currentResearchId={currentResearchId}
            isProcessingChat={isProcessingChat}
            onShareClick={onShareClick}
            loading={loading}
          />
        </div>

        {memorySuggestions.length > 0 &&
          onSaveMemorySuggestion &&
          onDismissMemorySuggestion &&
          onDismissAllMemorySuggestions && (
            <MemorySuggestionPanel
              suggestions={memorySuggestions}
              savingSuggestionId={savingMemorySuggestionId}
              onSave={onSaveMemorySuggestion}
              onDismiss={onDismissMemorySuggestion}
              onDismissAll={onDismissAllMemorySuggestions}
            />
          )}

        <div className="pt-1 sm:pt-2" ref={chatContainerRef}></div>
        <div ref={finalBottomRef} />
      </div>

      <div id="input-area" className="container mb-4 px-4 lg:px-0">
        {clarificationPayload && onSkipClarification && onSubmitClarification ? (
          <ResearchClarification
            payload={clarificationPayload}
            onSkip={onSkipClarification}
            onSubmit={onSubmitClarification}
            isSubmitting={isClarificationLoading}
          />
        ) : pendingMemoryBridge && onUseMemoryBridge && onSkipMemoryBridge ? (
          <ResearchMemoryBridge
            classification={pendingMemoryBridge}
            onUseMemory={onUseMemoryBridge}
            onSkipMemory={onSkipMemoryBridge}
          />
        ) : showHumanFeedback && handleFeedbackSubmit ? (
          <HumanFeedback
            questionForHuman={questionForHuman}
            onFeedbackSubmit={handleFeedbackSubmit}
            isSubmitting={isSubmittingHumanFeedback}
          />
        ) : loading || isProcessingChat ? (
          <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-900/80 px-4 py-4 shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{latestStatusMessage}</p>
                <p className="mt-1 text-xs text-gray-400">
                  研究过程中会持续在上方展示进度和执行日志。
                </p>
              </div>
              <LoadingDots />
            </div>
          </div>
        ) : (
          <div>
            {isInChatMode && !isStopped ? (
              <ChatInput
                promptValue={chatPromptValue}
                setPromptValue={setChatPromptValue}
                handleSubmit={handleChat}
                disabled={loading || isProcessingChat}
              />
            ) : showResult && reset ? (
              <InputArea
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleSubmit={handleDisplayResult}
                disabled={loading}
                reset={reset}
                isStopped={isStopped}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
