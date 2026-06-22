const DISMISSED_REPORTS_STORAGE_KEY = "gptr-memory-suggestions-dismissed";

function readStorageList(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStorageList(key: string, values: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore storage failures and keep runtime state as fallback.
  }
}

export function hasDismissedMemorySuggestions(reportId: string): boolean {
  return readStorageList(DISMISSED_REPORTS_STORAGE_KEY).includes(reportId);
}

export function markMemorySuggestionsDismissed(reportId: string) {
  const nextValues = Array.from(new Set([...readStorageList(DISMISSED_REPORTS_STORAGE_KEY), reportId]));
  writeStorageList(DISMISSED_REPORTS_STORAGE_KEY, nextValues);
}
