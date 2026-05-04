export function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const title = "title" in error ? (error as { title?: unknown }).title : null;
    const message = "message" in error ? (error as { message?: unknown }).message : null;
    if (title || message) {
      return [title, message].filter(Boolean).map(String).join(": ");
    }

    if ("message" in error) {
      const message = (error as { message?: unknown }).message;
      if (message) return String(message);
    }

    const action = "action" in error ? (error as { action?: unknown }).action : null;
    const parts = [action].filter(Boolean).map(String);
    if (parts.length > 0) return parts.join(" ");

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
}
