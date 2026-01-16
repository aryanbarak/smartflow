import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { askLearnAI } from "@/features/learn-ai/aiService";
import type {
  LearnAIMode,
  LearnAILanguage,
  LearnAIMessage,
} from "@/features/learn-ai/types";
import { insertMessage, listHistory } from "@/features/learn-ai/learnAiService";

const DEFAULT_MODE: LearnAIMode = "fiae_algorithms";
const DEFAULT_LANGUAGE: LearnAILanguage = "de";

const formatErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) {
    const debug = (err as { debug?: string }).debug;
    return debug ? `${err.message}\nDebug: ${debug}` : err.message;
  }
  return fallback;
};

export function useLearnAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LearnAIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setIsLoading(false);
    }
  }, [mode, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearLocalView = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) {
        setError("You must be signed in to use Learn AI.");
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
        setError(
          err instanceof Error ? err.message : "Failed to save your message."
        );
      }

      let answer = "";
      try {
        const result = await askLearnAI({ message: trimmed, mode, language });
        answer = result.answer;
      } catch (err) {
        setError(formatErrorMessage(err, "Failed to get AI response."));
        answer = "Sorry, I couldn't generate a response. Please try again.";
      }

      const assistantMessage: LearnAIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        createdAt: new Date().toISOString(),
        language,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        await insertMessage({
          userId: user.id,
          mode,
          language,
          role: "assistant",
          content: answer,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save the assistant reply."
        );
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
