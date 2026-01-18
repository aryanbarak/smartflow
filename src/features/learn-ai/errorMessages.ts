import type { LearnAILanguage } from "./types";

type ErrorMessageKey =
  | "not_configured"
  | "network_error"
  | "timeout"
  | "bad_response"
  | "quota_exceeded"
  | "parse_error"
  | "unknown_error";

type ErrorMessages = {
  [key in ErrorMessageKey]: {
    [lang in LearnAILanguage]: {
      title: string;
      message: string;
      action?: string;
    };
  };
};

export const ERROR_MESSAGES: ErrorMessages = {
  not_configured: {
    de: {
      title: "Konfigurationsfehler",
      message: "AI-Endpunkt ist nicht konfiguriert.",
      action: "Bitte kontaktieren Sie den Administrator.",
    },
    fa: {
      title: "خطای پیکربندی",
      message: "نقطه پایانی AI پیکربندی نشده است.",
      action: "لطفاً با مدیر سیستم تماس بگیرید.",
    },
    en: {
      title: "Configuration Error",
      message: "AI endpoint is not configured.",
      action: "Please contact the administrator.",
    },
  },
  network_error: {
    de: {
      title: "Verbindungsfehler",
      message: "Der AI-Server ist nicht erreichbar.",
      action: "Bitte überprüfen Sie Ihre Internetverbindung.",
    },
    fa: {
      title: "خطای اتصال",
      message: "سرور AI در دسترس نیست.",
      action: "لطفاً اتصال اینترنت خود را بررسی کنید.",
    },
    en: {
      title: "Connection Error",
      message: "Unable to reach the AI server.",
      action: "Please check your internet connection.",
    },
  },
  timeout: {
    de: {
      title: "Zeitüberschreitung",
      message: "Die Anfrage hat zu lange gedauert.",
      action: "Bitte versuchen Sie es mit einer kürzeren Frage erneut.",
    },
    fa: {
      title: "زمان انقضا",
      message: "درخواست بیش از حد طول کشید.",
      action: "لطفاً با یک سوال کوتاه‌تر دوباره امتحان کنید.",
    },
    en: {
      title: "Timeout",
      message: "The request took too long.",
      action: "Please try again with a shorter question.",
    },
  },
  bad_response: {
    de: {
      title: "Serverfehler",
      message: "Der AI-Server hat einen Fehler zurückgegeben.",
      action: "Bitte versuchen Sie es später erneut.",
    },
    fa: {
      title: "خطای سرور",
      message: "سرور AI با خطا مواجه شد.",
      action: "لطفاً بعداً دوباره امتحان کنید.",
    },
    en: {
      title: "Server Error",
      message: "The AI server returned an error.",
      action: "Please try again later.",
    },
  },
  quota_exceeded: {
    de: {
      title: "Limit erreicht",
      message: "Das AI-Kontingent wurde überschritten.",
      action: "Bitte warten Sie einige Minuten und versuchen Sie es erneut.",
    },
    fa: {
      title: "سهمیه تمام شد",
      message: "سهمیه AI به پایان رسیده است.",
      action: "لطفاً چند دقیقه صبر کنید و دوباره امتحان کنید.",
    },
    en: {
      title: "Quota Exceeded",
      message: "The AI quota has been exceeded.",
      action: "Please wait a few minutes and try again.",
    },
  },
  parse_error: {
    de: {
      title: "Verarbeitungsfehler",
      message: "Die AI-Antwort konnte nicht verarbeitet werden.",
      action: "Bitte versuchen Sie es erneut.",
    },
    fa: {
      title: "خطای پردازش",
      message: "پاسخ AI قابل پردازش نبود.",
      action: "لطفاً دوباره تلاش کنید.",
    },
    en: {
      title: "Processing Error",
      message: "The AI response could not be processed.",
      action: "Please try again.",
    },
  },
  unknown_error: {
    de: {
      title: "Unbekannter Fehler",
      message: "Ein unerwarteter Fehler ist aufgetreten.",
      action: "Bitte versuchen Sie es erneut.",
    },
    fa: {
      title: "خطای ناشناخته",
      message: "یک خطای غیرمنتظره رخ داد.",
      action: "لطفاً دوباره تلاش کنید.",
    },
    en: {
      title: "Unknown Error",
      message: "An unexpected error occurred.",
      action: "Please try again.",
    },
  },
};

export function getErrorMessage(
  key: ErrorMessageKey,
  language: LearnAILanguage
): { title: string; message: string; action?: string } {
  return ERROR_MESSAGES[key][language];
}

export function formatErrorForUser(
  error: unknown,
  language: LearnAILanguage
): { title: string; message: string; action?: string; canRetry: boolean } {
  // Default fallback
  let key: ErrorMessageKey = "unknown_error";
  let canRetry = true;

  if (error instanceof Error) {
    const errorCode = (error as any).code;

    switch (errorCode) {
      case "AI_AGENT_NOT_CONFIGURED":
        key = "not_configured";
        canRetry = false;
        break;
      case "AI_AGENT_REQUEST_FAILED":
        key = "network_error";
        canRetry = true;
        break;
      case "AI_AGENT_TIMEOUT":
        key = "timeout";
        canRetry = true;
        break;
      case "AI_AGENT_BAD_RESPONSE":
        key = "bad_response";
        canRetry = true;
        break;
      default:
        // Check if it's a quota error by message
        if (
          error.message.toLowerCase().includes("quota") ||
          error.message.toLowerCase().includes("429") ||
          error.message.toLowerCase().includes("سهمیه")
        ) {
          key = "quota_exceeded";
          canRetry = true;
        } else {
          key = "unknown_error";
          canRetry = true;
        }
    }
  }

  return {
    ...getErrorMessage(key, language),
    canRetry,
  };
}
