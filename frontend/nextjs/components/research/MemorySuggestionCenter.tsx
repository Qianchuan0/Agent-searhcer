"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import MemorySuggestionPanel from "@/components/research/MemorySuggestionPanel";
import { MemorySuggestion } from "@/types/data";
import { useResearchStore } from "@/stores/researchStore";

interface MemorySuggestionCenterProps {
  suggestions: MemorySuggestion[];
  savingSuggestionId?: string | null;
  onSave: (suggestion: MemorySuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll: () => void;
  reportReady: boolean;
  isMobile?: boolean;
}

const MIN_TEASER_DELAY_MS = 10000;
const MAX_TEASER_DELAY_MS = 20000;
const EDGE_GAP_PX = 24;
const INSPECTOR_WIDTH_PX = 320;
const DRAWER_GAP_PX = 16;

export default function MemorySuggestionCenter({
  suggestions,
  savingSuggestionId = null,
  onSave,
  onDismiss,
  onDismissAll,
  reportReady,
  isMobile = false,
}: MemorySuggestionCenterProps) {
  const inspectorOpen = useResearchStore((state) => state.inspectorOpen);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const hasReadingInteractionRef = useRef(false);
  const minDelayPassedRef = useRef(false);

  const suggestionCount = suggestions.length;
  const teaserLabel = useMemo(() => {
    if (suggestionCount <= 0) {
      return "";
    }
    return `已整理出 ${suggestionCount} 条可保存记忆`;
  }, [suggestionCount]);

  const floatingRight = inspectorOpen ? INSPECTOR_WIDTH_PX + EDGE_GAP_PX : EDGE_GAP_PX;
  const drawerRight = inspectorOpen ? INSPECTOR_WIDTH_PX + DRAWER_GAP_PX : DRAWER_GAP_PX;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!suggestions.length) {
      setDrawerOpen(false);
      setTeaserVisible(false);
      setCompactVisible(false);
      hasReadingInteractionRef.current = false;
      minDelayPassedRef.current = false;
      return;
    }

    if (drawerOpen) {
      setTeaserVisible(false);
      setCompactVisible(false);
    }
  }, [suggestions, drawerOpen]);

  useEffect(() => {
    if (!suggestions.length || !reportReady || isMobile) {
      return;
    }

    hasReadingInteractionRef.current = false;
    minDelayPassedRef.current = false;

    const maybeReveal = () => {
      if (!drawerOpen && minDelayPassedRef.current && hasReadingInteractionRef.current) {
        setTeaserVisible(true);
      }
    };

    const markInteraction = () => {
      hasReadingInteractionRef.current = true;
      maybeReveal();
    };

    const minTimer = window.setTimeout(() => {
      minDelayPassedRef.current = true;
      maybeReveal();
    }, MIN_TEASER_DELAY_MS);

    const maxTimer = window.setTimeout(() => {
      if (!drawerOpen) {
        setTeaserVisible(true);
      }
    }, MAX_TEASER_DELAY_MS);

    window.addEventListener("scroll", markInteraction, { passive: true });
    window.addEventListener("click", markInteraction);
    window.addEventListener("keydown", markInteraction);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("scroll", markInteraction);
      window.removeEventListener("click", markInteraction);
      window.removeEventListener("keydown", markInteraction);
    };
  }, [suggestions, reportReady, isMobile, drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const openDrawer = () => {
    setDrawerOpen(true);
    setTeaserVisible(false);
    setCompactVisible(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (suggestions.length) {
      setCompactVisible(true);
    }
  };

  const dismissTeaser = () => {
    setTeaserVisible(false);
    setCompactVisible(true);
  };

  const handleDismissAll = () => {
    onDismissAll();
    setDrawerOpen(false);
    setTeaserVisible(false);
    setCompactVisible(false);
  };

  if (!mounted || !suggestions.length || isMobile) {
    return null;
  }

  return createPortal(
    <>
      <AnimatePresence>
        {teaserVisible && !drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 z-[90] w-[min(360px,calc(100vw-32px))]"
            style={{ right: floatingRight }}
          >
            <div className="rounded-2xl border border-primary/30 bg-[var(--surface)]/95 p-4 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Long-Term Memory
              </p>
              <h4 className="mt-2 text-sm font-semibold text-ink">{teaserLabel}</h4>
              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                你可以先读完报告，再决定是否把这些内容保留到长期记忆。
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={openDrawer} className="neon-btn px-3 py-1.5 text-xs">
                  现在查看
                </button>
                <button type="button" onClick={dismissTeaser} className="ghost-btn px-3 py-1.5 text-xs">
                  稍后查看
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compactVisible && !drawerOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={openDrawer}
            className="fixed bottom-6 z-[90] rounded-full border border-primary/30 bg-[var(--surface)]/95 px-4 py-2 text-xs font-medium text-ink shadow-xl backdrop-blur transition hover:border-primary hover:text-primary"
            style={{ right: floatingRight }}
          >
            记忆建议 {suggestionCount}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
              onClick={closeDrawer}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 z-[101] h-full w-[min(520px,100vw)] p-3 sm:p-4"
              style={{ right: drawerRight }}
            >
              <MemorySuggestionPanel
                suggestions={suggestions}
                savingSuggestionId={savingSuggestionId}
                onSave={onSave}
                onDismiss={onDismiss}
                onDismissAll={handleDismissAll}
                onClose={closeDrawer}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
