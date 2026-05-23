import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { askLearnAI, formatError, type AIError } from "@/features/learn-ai/aiService";
import type {
  LearnAIMode,
  LearnAILanguage,
  LearnAIMessage,
} from "@/features/learn-ai/types";
import { insertMessage, listHistory } from "@/features/learn-ai/learnAiService";

const DEFAULT_MODE: LearnAIMode = "fiae_algorithms";
const DEFAULT_LANGUAGE: LearnAILanguage = "de";

function getSignInError(lang: LearnAILanguage): AIError {
  if (lang === "fa") {
    return { title: "نیاز به ورود", message: "برای استفاده از AI باید وارد شوید.", canRetry: false };
  }
  if (lang === "en") {
    return { title: "Sign In Required", message: "You must be signed in to use AI.", canRetry: false };
  }
  return { title: "Anmeldung erforderlich", message: "Sie müssen angemeldet sein, um AI zu verwenden.", canRetry: false };
}

function getFallbackAnswer(lang: LearnAILanguage): string {
  if (lang === "fa") return "متأسفانه نتوانستم پاسخ تولید کنم. لطفاً دوباره تلاش کنید.";
  if (lang === "en") return "Sorry, I couldn't generate a response. Please try again.";
  return "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.";
}

export function useLearnAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LearnAIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [mode, setMode] = useState<LearnAIMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<LearnAILanguage>(DEFAULT_LANGUAGE);
  // Ref keeps history fresh inside sendMessage without adding messages to useCallback deps
  const messagesRef = useRef<LearnAIMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const reload = useCallback(async () => {
    if (!user) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await listHistory(mode, user.id);
      setMessages(items);
    } catch (err) {
      setError(formatError(err, language));
    } finally {
      setIsLoading(false);
    }
  }, [mode, user, language]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearLocalView = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) {
        setError(getSignInError(language));
        return;
      }

      const trimmed = content.trim();
      if (!trimmed) return;

      setError(null);

      // Snapshot history before the optimistic update so the current message isn't duplicated
      const history = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: new Date().toISOString(), language },
      ]);

      try {
        await insertMessage({ userId: user.id, mode, language, role: "user", content: trimmed });
      } catch (err) {
        setError(formatError(err, language));
      }

      let answer: string;
      let aiError: AIError | null = null;
      try {
        const result = await askLearnAI({ message: trimmed, history });
        answer = result.answer;
      } catch (err) {
        console.error("[LearnAI] Error getting AI response:", err);
        aiError = formatError(err, language);
        setError(aiError);
        answer = getFallbackAnswer(language);
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answer, createdAt: new Date().toISOString(), language },
      ]);

      try {
        await insertMessage({ userId: user.id, mode, language, role: "assistant", content: answer });
      } catch (err) {
        console.error("[LearnAI] Failed to save assistant message:", err);
        if (!aiError) {
          setError(formatError(err, language));
        }
      }
    },
    [language, mode, user]
  );

  return {
    messages,
    isLoading,
    error,
    mode,
    language,
    setMode,
    setLanguage,
    sendMessage,
    clearLocalView,
    reload,
  };
}
