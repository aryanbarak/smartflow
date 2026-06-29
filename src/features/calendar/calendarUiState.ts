export type CalendarUiState = {
  activeTab: "all" | "today" | "week";
  viewAnchorDate: string;
  selectedDay: string | null;
  searchQuery: string;
  hasLocationOnly: boolean;
  hasNotesOnly: boolean;
};

const STORAGE_KEY = "smartflow:calendar:ui";
const VALID_TABS = new Set<CalendarUiState["activeTab"]>(["all", "today", "week"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isValidDayKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return false;
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day
  );
}

export function loadCalendarUiState(defaults: CalendarUiState): CalendarUiState {
  if (typeof window === "undefined" || !window.localStorage) return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return defaults;

    const activeTab = VALID_TABS.has(parsed.activeTab as CalendarUiState["activeTab"])
      ? (parsed.activeTab as CalendarUiState["activeTab"])
      : defaults.activeTab;
    const viewAnchorDate = isValidDayKey(parsed.viewAnchorDate)
      ? parsed.viewAnchorDate
      : defaults.viewAnchorDate;

    let selectedDay = defaults.selectedDay;
    if (parsed.selectedDay === null) {
      selectedDay = null;
    } else if (isValidDayKey(parsed.selectedDay)) {
      selectedDay = parsed.selectedDay;
    }

    return {
      activeTab,
      viewAnchorDate,
      selectedDay,
      searchQuery: typeof parsed.searchQuery === "string" ? parsed.searchQuery : defaults.searchQuery,
      hasLocationOnly: typeof parsed.hasLocationOnly === "boolean"
        ? parsed.hasLocationOnly
        : defaults.hasLocationOnly,
      hasNotesOnly: typeof parsed.hasNotesOnly === "boolean"
        ? parsed.hasNotesOnly
        : defaults.hasNotesOnly,
    };
  } catch {
    return defaults;
  }
}

export function saveCalendarUiState(state: CalendarUiState) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (e.g., private mode or quota).
  }
}
