import {
  resolveAiResponseLanguage,
  type SupportedAiResponseLanguage,
} from "@/features/ai/responseLanguage";
import { parseLlmIntentJson } from "./llmReasoningService";
import { validateAgentIntentProposal } from "./intentValidator";
import { buildReasoningPrompt } from "./reasoningPrompt";
import type {
  AgentLlmReasoningCaller,
  AgentReasoningInput,
  AgentReasoningResult,
} from "./reasoningTypes";

export interface ReasonAboutUserMessageDependencies {
  callLlmReasoning: AgentLlmReasoningCaller;
}

function fallbackRawProposal(
  userMessage: string,
  language: SupportedAiResponseLanguage,
  now: Date,
) {
  return {
    id: `intent:fallback:${now.toISOString()}`,
    type: "ask_clarification",
    confidence: "medium",
    userMessage,
    requiresTool: false,
    requiresApproval: false,
    clarificationQuestion:
      language === "fa"
        ? "می‌توانید دقیق‌تر بگویید چه کاری می‌خواهید انجام دهم؟"
        : language === "de"
          ? "Kannst du genauer sagen, was ich tun soll?"
          : "Can you clarify what you want me to do?",
    reasons: ["LLM output could not be parsed safely."],
    language,
    generatedAt: now.toISOString(),
    schemaVersion: 1,
  };
}

export async function reasonAboutUserMessage(
  input: AgentReasoningInput,
  dependencies: ReasonAboutUserMessageDependencies,
): Promise<AgentReasoningResult> {
  const now = input.now ?? new Date();
  const responseLanguage = resolveAiResponseLanguage({
    configuredResponseLanguage: input.configuredResponseLanguage,
    latestUserMessage: input.userMessage,
    interfaceLanguage: input.interfaceLanguage,
  });
  const prompt = buildReasoningPrompt({
    ...input,
    responseLanguage,
    now,
  });
  const llmResponse = await dependencies.callLlmReasoning({
    prompt,
    responseLanguage,
    sessionId: input.sessionId,
  }).catch(() => ({ rawText: "" }));
  const parsed = parseLlmIntentJson(llmResponse.rawText);
  const rawProposal = parsed.ok
    ? parsed.value
    : fallbackRawProposal(input.userMessage, responseLanguage, now);
  const validation = validateAgentIntentProposal({
    rawProposal,
    userMessage: input.userMessage,
    safeContext: input.safeContext,
    language: responseLanguage,
    now,
  });

  return {
    ...validation,
    responseLanguage,
    promptPreview: {
      containsTaskNotes: false,
      containsRawMemory: false,
      containsAuditPolicy: false,
      containsUserId: false,
    },
  };
}
