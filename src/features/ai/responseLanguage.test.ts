import { describe, expect, it } from "vitest";
import {
  detectAiResponseLanguage,
  getAiResponseDirection,
  getAiResponseLanguageInstruction,
  getStoredAiResponseLanguage,
  resolveAiResponseLanguage,
} from "./responseLanguage";

const PERSIAN_REVIEW_TASKS =
  "\u0644\u0637\u0641\u0627 \u06a9\u0627\u0631\u0647\u0627\u06cc \u0627\u0645\u0631\u0648\u0632 \u0631\u0627 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646";
const PERSIAN_TECHNICAL =
  "\u0644\u0637\u0641\u0627 `tasks.complete` \u0631\u0627 \u062a\u0648\u0636\u06cc\u062d \u0628\u062f\u0647 \u0648 URL https://example.com \u0631\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u0646\u062f\u0647";
const PERSIAN_ANSWER_REQUEST =
  "\u0644\u0637\u0641\u0627 \u0641\u0627\u0631\u0633\u06cc \u062c\u0648\u0627\u0628 \u0628\u062f\u0647";

describe("AI response language resolution", () => {
  it("uses explicit configured response languages before interface language or detection", () => {
    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "fa",
      interfaceLanguage: "en",
      latestUserMessage: "Please answer in English.",
    })).toBe("fa");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "en",
      interfaceLanguage: "fa",
      latestUserMessage: PERSIAN_ANSWER_REQUEST,
    })).toBe("en");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "de",
      interfaceLanguage: "en",
      latestUserMessage: "What should I do today?",
    })).toBe("de");
  });

  it("detects Persian, German, and English for auto response language", () => {
    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      latestUserMessage: PERSIAN_REVIEW_TASKS,
    })).toBe("fa");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      latestUserMessage: "Kannst du bitte meine Termine f\u00fcr heute planen?",
    })).toBe("de");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "fa",
      latestUserMessage: "Please review my tasks for today.",
    })).toBe("en");
  });

  it("uses the dominant natural-language portion for mixed technical input", () => {
    expect(detectAiResponseLanguage(PERSIAN_TECHNICAL)).toBe("fa");
    expect(detectAiResponseLanguage("Please explain `tasks.complete` and keep SmartFlow unchanged.")).toBe("en");
  });

  it("falls back to interface language only when auto detection is unclear", () => {
    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "fa",
      latestUserMessage: "SmartFlow MCP RAG",
    })).toBe("fa");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "unsupported",
      latestUserMessage: "MCP RAG",
    })).toBe("en");
  });

  it("migrates existing stored fixed response language and defaults missing values to auto", () => {
    const storage = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
    } as Storage;

    expect(getStoredAiResponseLanguage(fakeStorage)).toBe("auto");
    storage.set("smartflow:v1:ai-defaults", JSON.stringify({ mode: "fiae_algorithms", language: "de" }));
    expect(getStoredAiResponseLanguage(fakeStorage)).toBe("de");
    storage.set("smartflow:v1:ai-defaults", JSON.stringify({ mode: "fiae_algorithms", aiResponseLanguage: "auto" }));
    expect(getStoredAiResponseLanguage(fakeStorage)).toBe("auto");
  });

  it("builds explicit prompt instructions and response directions", () => {
    expect(getAiResponseLanguageInstruction("en")).toContain("Respond in English.");
    expect(getAiResponseLanguageInstruction("de")).toContain("Antworte auf Deutsch.");
    expect(getAiResponseLanguageInstruction("fa")).toContain("\u0641\u0627\u0631\u0633\u06cc");
    expect(getAiResponseLanguageInstruction("fa")).not.toContain("only communicate in English");

    expect(getAiResponseDirection("fa")).toBe("rtl");
    expect(getAiResponseDirection("en")).toBe("ltr");
    expect(getAiResponseDirection("de")).toBe("ltr");
  });
});
