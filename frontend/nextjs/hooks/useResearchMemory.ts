"use client";

import { useEffect, useState } from "react";
import {
  MemoryCreateRequest,
  MemoryItem,
  MemorySearchResponse,
  MemorySettings,
  MemorySuggestion,
  ReportMemoryResponse,
  ResearchClassificationResponse,
} from "../types/data";

export const useResearchMemory = () => {
  const [settings, setSettings] = useState<MemorySettings | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    setItems(data.items || []);
    return data.items || [];
  };

  const createItem = async (payload: MemoryCreateRequest) => {
    const response = await fetch("/api/memory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create memory item: ${response.status}`);
    }
    const data = (await response.json()) as { item: MemoryItem };
    setItems((prev) => [data.item, ...prev]);
    return data.item;
  };

  const updateItem = async (memoryId: string, payload: Partial<MemoryItem>) => {
    const response = await fetch(`/api/memory/items/${memoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update memory item: ${response.status}`);
    }
    const data = (await response.json()) as { item: MemoryItem };
    setItems((prev) => prev.map((item) => (item.id === memoryId ? data.item : item)));
    return data.item;
  };

  const deleteItem = async (memoryId: string) => {
    const response = await fetch(`/api/memory/items/${memoryId}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`Failed to delete memory item: ${response.status}`);
    }
    setItems((prev) => prev.filter((item) => item.id !== memoryId));
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
    const data = (await response.json()) as { suggestions: MemorySuggestion[] };
    return data.suggestions || [];
  };

  const getReportMemory = async (reportId: string) => {
    const response = await fetch(`/api/reports/${reportId}/memory`);
    if (!response.ok) {
      throw new Error(`Failed to fetch report memory: ${response.status}`);
    }
    return (await response.json()) as ReportMemoryResponse;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await refreshSettings();
        await refreshItems();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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
