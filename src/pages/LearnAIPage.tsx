import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatePanel } from "@/components/common/StatePanel";
import { cn } from "@/lib/utils";
import { useLearnAI } from "@/hooks/useLearnAI";
import type { LearnAILanguage, LearnAIMode } from "@/features/learn-ai/types";

const MODE_OPTIONS: { value: LearnAIMode; label: string }[] = [
  { value: "fiae_algorithms", label: "Algorithms" },
  { value: "general_it", label: "General IT" },
  { value: "wiso", label: "WISO" },
  { value: "planner", label: "Planner" },
];

const LANGUAGE_OPTIONS: { value: LearnAILanguage; label: string }[] = [
  { value: "de", label: "DE" },
  { value: "fa", label: "FA" },
  { value: "en", label: "EN" },
];

export default function LearnAIPage() {
  const {
    messages,
    isLoading,
    error,
    mode,
    language,
    setMode,
    setLanguage,
    sendMessage,
  } = useLearnAI();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const historyItems = useMemo(
    () => messages.filter((item) => item.role === "user").slice(-20).reverse(),
    [messages]
  );

  const handleSend = async () => {
    if (!draft.trim()) return;
    setIsSending(true);
    await sendMessage(draft);
    setDraft("");
    setIsSending(false);
  };

  const handleHistoryClick = (id: string) => {
    setHighlightedId(id);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedId(null);
    }, 1500);
    const target = document.getElementById(`learnai-msg-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">
            Learn with AI
          </h1>
          <p className="text-muted-foreground">
            Learn algorithms and IT concepts with your personal AI tutor
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="min-h-[360px]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">
            {isLoading && messages.length === 0 ? (
              <StatePanel
                variant="loading"
                title="Loading learning history..."
                description="Fetching your recent questions."
              />
            ) : error && messages.length === 0 ? (
              <StatePanel
                variant="error"
                title="Learning history failed to load"
                description={error}
              />
            ) : messages.length === 0 ? (
              <StatePanel
                variant="empty"
                title="Ask your first question to start learning."
                description="Your AI tutor is ready when you are."
              />
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {messages.map((message) => {
                  const messageLanguage =
                    "language" in message && message.language
                      ? message.language
                      : language;
                  const isRtl = messageLanguage === "fa";

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        id={`learnai-msg-${message.id}`}
                        dir={isRtl ? "rtl" : "ltr"}
                        lang={isRtl ? "fa" : messageLanguage}
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm transition-shadow",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground",
                          isRtl
                            ? "text-right font-fa leading-7 whitespace-pre-wrap break-words"
                            : "text-left leading-7 whitespace-pre-wrap break-words",
                          highlightedId === message.id
                            ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
                            : "ring-0"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {error && messages.length > 0 && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about data structures, networks, or anything else..."
                rows={3}
                disabled={isSending}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => void handleSend()}
                  disabled={isSending || !draft.trim()}
                >
                  <Send className="w-4 h-4" />
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Learning mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {MODE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={mode === option.value ? "secondary" : "outline"}
                    onClick={() => setMode(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={language === option.value ? "secondary" : "outline"}
                    onClick={() => setLanguage(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[180px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoading && messages.length === 0 ? (
                <StatePanel
                  variant="loading"
                  title="Loading learning history..."
                  description="Fetching your recent prompts."
                />
              ) : error && messages.length === 0 ? (
                <StatePanel
                  variant="error"
                  title="History failed to load"
                  description={error}
                />
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Your learning history will appear here.
                </p>
              ) : (
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {historyItems.map((item) => {
                      const itemLanguage =
                        "language" in item && item.language
                          ? item.language
                          : language;
                      const isRtl = itemLanguage === "fa";

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            dir={isRtl ? "rtl" : "ltr"}
                            lang={isRtl ? "fa" : itemLanguage}
                            aria-label={`Go to message: ${item.content}`}
                            onClick={() => handleHistoryClick(item.id)}
                            className={cn(
                              "w-full rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              isRtl
                                ? "text-right font-fa leading-7 whitespace-pre-wrap break-words"
                                : "text-left leading-7 whitespace-pre-wrap break-words"
                            )}
                          >
                            {item.content}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
