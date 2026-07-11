import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

function dateKey(value: string) {
  return value.slice(0, 10);
}

export const calendarListTodayHandler: AgentToolHandler = {
  toolId: "calendar.list_today",
  timeoutMs: 1000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  execute(_input, context) {
    const today = (context.currentTime ?? new Date().toISOString()).slice(0, 10);
    return {
      events: (context.events ?? [])
        .filter((event) => dateKey(event.dateTimeStart ?? event.start ?? "") === today)
        .map((event) => ({
          id: event.id,
          title: event.title,
          start: event.dateTimeStart ?? event.start,
          end: event.end,
          location: event.location,
        })),
    };
  },
};
