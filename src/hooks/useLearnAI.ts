import { useCallback, useEffect, useState } from "react";
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

export function useLearnAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LearnAIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [mode, setMode] = useState<LearnAIMode>(DEFAULT_MODE);
  const [language, setLanguage] = useState<LearnAILanguage>(DEFAULT_LANGUAGE);

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
      const formattedError = formatError(err, language);
      setError(formattedError);
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
        setError({
          title: language === "fa" ? "نیاز به ورود" : language === "en" ? "Sign In Required" : "Anmeldung erforderlich",
          message: language === "fa" ? "برای استفاده از AI باید وارد شوید." : language === "en" ? "You must be signed in to use AI." : "Sie müssen angemeldet sein, um AI zu verwenden.",
          canRetry: false,
        });
        return;
      }

      const trimmed = content.trim();
      if (!trimmed) return;

      setError(null);

      const optimisticUser: LearnAIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        language,
      };

      setMessages((prev) => [...prev, optimisticUser]);

      try {
        await insertMessage({
          userId: user.id,
          mode,
          language,
          role: "user",
          content: trimmed,
        });
      } catch (err) {
        const formattedError = formatError(err, language);
        setError(formattedError);
      }

      let answer = "";
      let aiError: AIError | null = null;
      
      try {
        const result = await askLearnAI({ message: trimmed, mode, language });
        answer = result.answer;
        
        // Log if cached
        if (result.cached && import.meta.env.DEV) {
          console.debug(`[LearnAI] Response from cache (requestId=${result.requestId})`);
        }
      } catch (err) {
        console.error('[LearnAI] Error getting AI response:', err);
        aiError = formatError(err, language);
        setError(aiError);
        
        // Provide fallback answer based on language
        answer = language === "fa" 
          ? "متأسفانه نتوانستم پاسخ تولید کنم. لطفاً دوباره تلاش کنید."
          : language === "en"
          ? "Sorry, I couldn't generate a response. Please try again."
          : "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.";
      }

      const assistantMessage: LearnAIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        createdAt: new Date().toISOString(),
        language,
      };

      // Always add message to UI even if storage fails
      setMessages((prev) => [...prev, assistantMessage]);

      // Try to save to localStorage, but don't let it crash the UI
      try {
        await insertMessage({
          userId: user.id,
          mode,
          language,
          role: "assistant",
          content: answer,
        });
      } catch (err) {
        console.error('[LearnAI] Failed to save message to localStorage:', err);
        // Don't update error state here to avoid overwriting AI error
        if (!aiError) {
          const formattedError = formatError(err, language);
          setError(formattedError);
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
