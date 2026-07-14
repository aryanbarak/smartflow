import type { AiResponseLanguage } from "@/features/ai/responseLanguage";

export type LearnAIMode = "fiae_algorithms" | "general_it" | "wiso" | "planner";

export type LearnAIRole = "user" | "assistant";

export type LearnAILanguage = "de" | "fa" | "en";
export type LearnAIResponseLanguage = AiResponseLanguage;

export interface LearnAIMessage {
  id: string;
  role: LearnAIRole;
  content: string;
  createdAt: string;
  language?: LearnAILanguage;
}

export interface LearnAISession {
  id: string;
  title: string;
  mode: LearnAIMode;
  language: LearnAILanguage;
  createdAt: string;
}
