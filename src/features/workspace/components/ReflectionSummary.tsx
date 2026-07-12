import { Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { useT, type TranslationKey } from "@/i18n";
import type {
  AgentReflectionGoalProgress,
  AgentReflectionOutcome,
  AgentReflectionStepAssessment,
  ReadOnlyRuntimeResult,
  SupportedReadOnlyToolId,
} from "@/features/agent";

export interface ReflectionSummaryProps {
  result: ReadOnlyRuntimeResult | null;
}

const titleKeyByOutcome: Record<AgentReflectionOutcome, TranslationKey> = {
  successful: "reflection_outcome_successful",
  empty: "reflection_outcome_empty",
  partial: "reflection_outcome_partial",
  policy_denied: "reflection_outcome_policy_denied",
  timeout: "reflection_outcome_timeout",
  failed: "reflection_outcome_failed",
  invalid: "reflection_outcome_invalid",
};

const progressKeyByValue: Partial<Record<AgentReflectionGoalProgress, TranslationKey>> = {
  informed: "reflection_goal_progress_informed",
  supported: "reflection_goal_progress_supported",
  unknown: "reflection_goal_progress_unknown",
};

const assessmentKeyByValue: Record<AgentReflectionStepAssessment, TranslationKey> = {
  information_gathered: "reflection_step_information_gathered",
  blocked: "reflection_step_blocked",
  failed: "reflection_step_failed",
  not_started: "reflection_step_not_started",
};

function supportedToolId(toolId: string | undefined): SupportedReadOnlyToolId | null {
  if (
    toolId === "tasks.list" ||
    toolId === "calendar.list_today" ||
    toolId === "learning.get_progress" ||
    toolId === "workspace.get_context"
  ) {
    return toolId;
  }

  return null;
}

function toolReflectionKey(
  toolId: string | undefined,
  outcome: AgentReflectionOutcome,
): TranslationKey {
  const normalizedToolId = supportedToolId(toolId);

  if (normalizedToolId === "tasks.list") {
    return outcome === "empty"
      ? "reflection_tool_tasks_empty"
      : "reflection_tool_tasks_success";
  }

  if (normalizedToolId === "calendar.list_today") {
    return outcome === "empty"
      ? "reflection_tool_calendar_empty"
      : "reflection_tool_calendar_success";
  }

  if (normalizedToolId === "learning.get_progress") {
    return outcome === "empty"
      ? "reflection_tool_learning_empty"
      : "reflection_tool_learning_success";
  }

  if (normalizedToolId === "workspace.get_context") {
    return "reflection_tool_workspace_success";
  }

  return "reflection_tool_generic";
}

function shouldShowFollowUp(outcome: AgentReflectionOutcome, followUp: string | undefined) {
  return Boolean(followUp) && outcome !== "policy_denied";
}

export function ReflectionSummary({ result }: Readonly<ReflectionSummaryProps>) {
  const { t, isRTL } = useT();
  const reflection = result?.reflection;

  if (!result || !reflection) return null;

  const titleKey = titleKeyByOutcome[reflection.outcome];
  const progressKey = progressKeyByValue[reflection.goalProgress];
  const assessmentKey = assessmentKeyByValue[reflection.stepAssessment];
  const Icon = reflection.outcome === "policy_denied" ? ShieldAlert : Sparkles;

  return (
    <section
      aria-live="polite"
      dir={isRTL ? "rtl" : "ltr"}
      className="mt-3 rounded-lg border border-border/30 bg-background/20 px-3 py-3"
    >
      <div className="flex items-start gap-2.5">
        <div className="icon-tile mt-0.5 h-7 w-7 shrink-0 rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("reflection_section_label")}
            </p>
            <h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
              {t(titleKey)}
            </h3>
          </div>

          <div className="space-y-1 text-xs leading-5 text-muted-foreground">
            <p>{t(toolReflectionKey(result.toolId, reflection.outcome))}</p>
            {progressKey && <p>{t(progressKey)}</p>}
            <p>
              <span className="font-medium text-foreground">
                {t("reflection_step_assessment_label")}
              </span>{" "}
              {t(assessmentKey)}
            </p>
          </div>

          {shouldShowFollowUp(reflection.outcome, reflection.suggestedFollowUp) && (
            <div className="rounded-md border border-primary/10 bg-primary/[0.06] px-2.5 py-2 text-xs leading-5">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("reflection_follow_up_label")}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {t("reflection_follow_up_default")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.memoryEvidenceRetained && (
            <p className="rounded-md border border-border/25 bg-secondary/[0.08] px-2.5 py-2 text-xs leading-5 text-muted-foreground">
              {t("reflection_memory_notice")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
