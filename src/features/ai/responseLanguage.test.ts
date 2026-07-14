import { describe, expect, it } from "vitest";
import {
  detectAiResponseLanguage,
  getAiResponseDirection,
  getAiResponseLanguageInstruction,
  getStoredAiResponseLanguage,
  resolveAiResponseLanguage,
} from "./responseLanguage";

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
      latestUserMessage: "لطفا فارسی جواب بده",
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
      latestUserMessage: "لطفا کارهای امروز را بررسی کن",
    })).toBe("fa");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      latestUserMessage: "Kannst du bitte meine Termine für heute planen?",
    })).toBe("de");

    expect(resolveAiResponseLanguage({
      configuredResponseLanguage: "auto",
      interfaceLanguage: "fa",
      latestUserMessage: "Please review my tasks for today.",
    })).toBe("en");
  });

  it("uses the dominant natural-language portion for mixed technical input", () => {
    expect(detectAiResponseLanguage("لطفا `tasks.complete` را توضیح بده و URL https://example.com را تغییر نده")).toBe("fa");
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
    expect(getAiResponseLanguageInstruction("fa")).toContain("به زبان فارسی پاسخ بده.");
    expect(getAiResponseLanguageInstruction("fa")).not.toContain("only communicate in English");

    expect(getAiResponseDirection("fa")).toBe("rtl");
    expect(getAiResponseDirection("en")).toBe("ltr");
    expect(getAiResponseDirection("de")).toBe("ltr");
  });
});
