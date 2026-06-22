"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  MemoryCreateRequest,
  MemoryItem,
  MemorySearchResponse,
  MemorySettings,
  MemorySuggestion,
  MemorySuggestionsResponse,
  ReportMemoryResponse,
  ResearchClassificationResponse,
} from "../types/data";

const MEMORY_SETTINGS_STORAGE_KEY = "gptr-memory-settings";

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail;
    }
  } catch {
    // Ignore parse failures and return fallback.
  }
  return fallback;
}

interface ResearchMemoryState {
  settings: MemorySettings | null;
  items: MemoryItem[];
  loading: boolean;
  initialized: boolean;
  setSettings: (settings: MemorySettings | null) => void;
  setItems: (items: MemoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

const readCachedSettings = (): MemorySettings | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(MEMORY_SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemorySettings) : null;
  } catch {
    return null;
  }
};

const writeCachedSettings = (settings: MemorySettings | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!settings) {
      localStorage.removeItem(MEMORY_SETTINGS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(MEMORY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore local cache failures and keep network state authoritative.
  }
};

const useResearchMemoryStore = create<ResearchMemoryState>((set) => ({
  settings: readCachedSettings(),
  items: [],
  loading: false,
  initialized: false,
  setSettings: (settings) => {
    writeCachedSettings(settings);
    set({ settings });
  },
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

export const useResearchMemory = () => {
  const {
    settings,
    items,
    loading,
    initialized,
    setSettings,
    setItems,
    setLoading,
    setInitialized,
  } = useResearchMemoryStore();

  const refreshSettings = async () => {
    const response = await fetch("/api/memory/settings");
    if (!response.ok) {
      throw new Error(`Failed to fetch memory settings: ${response.status}`);
    }
    const data = (await response.json()) as MemorySettings;
    setSettings(data);
    return data;
  };

  const updateSettings = async (enabled: boolean) => {
    const response = await fetch("/api/memory/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update memory settings: ${response.status}`);
    }
    const data = (await response.json()) as MemorySettings;
    setSettings(data);
    return data;
  };

  const refreshItems = async (params?: { type?: string; status?: string; tag?: string }) => {
    const search = new URLSearchParams();
    if (params?.type) search.set("memory_type", params.type);
    if (params?.status) search.set("status", params.status);
    if (params?.tag) search.set("tag", params.tag);
    const query = search.toString();

    const response = await fetch(query ? `/api/memory/items?${query}` : "/api/memory/items");
    if (!response.ok) {
      throw new Error(`Failed to fetch memory items: ${response.status}`);
    }
    const data = (await response.json()) as { items: MemoryItem[] };
    const nextItems = data.items || [];
    setItems(nextItems);
    return nextItems;
  };

  const createItem = async (payload: MemoryCreateRequest) => {
    const response = await fetch("/api/memory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Failed to create memory item: ${response.status}`));
    }
    const data = (await response.json()) as { item: MemoryItem };
    setItems([data.item, ...items]);
    return data.item;
  };

  const updateItem = async (memoryId: string, payload: Partial<MemoryItem>) => {
    const response = await fetch(`/api/memory/items/${memoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Failed to update memory item: ${response.status}`));
    }
    const data = (await response.json()) as { item: MemoryItem };
    setItems(items.map((item) => (item.id === memoryId ? data.item : item)));
    return data.item;
  };

  const deleteItem = async (memoryId: string) => {
    const response = await fetch(`/api/memory/items/${memoryId}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`Failed to delete memory item: ${response.status}`);
    }
    setItems(items.filter((item) => item.id !== memoryId));
    return true;
  };

  const searchMemory = async (query: string, limit = 5) => {
    const response = await fetch("/api/memory/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });
    if (!response.ok) {
      throw new Error(`Failed to search memory: ${response.status}`);
    }
    return (await response.json()) as MemorySearchResponse;
  };

  const classifyResearch = async (query: string) => {
    const response = await fetch("/api/memory/classify-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`Failed to classify research: ${response.status}`);
    }
    return (await response.json()) as ResearchClassificationResponse;
  };

  const getSuggestions = async (reportId: string) => {
    const response = await fetch("/api/memory/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to generate memory suggestions: ${response.status}`);
    }
    return (await response.json()) as MemorySuggestionsResponse;
  };

  const getReportMemory = async (reportId: string) => {
    const response = await fetch(`/api/reports/${reportId}/memory`);
    if (!response.ok) {
      throw new Error(`Failed to fetch report memory: ${response.status}`);
    }
    return (await response.json()) as ReportMemoryResponse;
  };

  useEffect(() => {
    if (initialized) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await refreshSettings();
        await refreshItems();
      } catch (error) {
        console.error("Failed to initialize research memory state:", error);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    void load();
  }, [initialized]);

  return {
    settings,
    items,
    loading,
    refreshSettings,
    updateSettings,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    searchMemory,
    classifyResearch,
    getSuggestions,
    getReportMemory,
  };
};
