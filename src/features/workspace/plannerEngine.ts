import type {
  WorkspacePlan,
  WorkspacePlanActionType,
  WorkspacePlannerEngineInput,
  WorkspacePlanStep,
  WorkspacePriorityConfidence,
  WorkspaceRoute,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const MAX_STEPS = 4;
const MIN_STEPS = 2;
const MAX_PLAN_EFFORT_MINUTES = 90;
const ALLOWED_STEP_MINUTES = [5, 10, 15, 20, 25, 30, 45] as const;

type StepDraft = Omit<
  WorkspacePlanStep,
  "id" | "order" | "estimatedMinutes" | "status" | "dependencies"
> & {
  estimatedMinutes: number;
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clampPlanEffort(goalEffort: number) {
  return Math.max(10, Math.min(MAX_PLAN_EFFORT_MINUTES, goalEffort));
}

function nearestAllowedMinutes(minutes: number) {
  return ALLOWED_STEP_MINUTES.reduce((closest, value) =>
    Math.abs(value - minutes) < Math.abs(closest - minutes) ? value : closest,
  );
}

function totalMinutes(steps: Pick<WorkspacePlanStep, "estimatedMinutes">[]) {
  return steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);
}

function normalizeEffort(steps: StepDraft[], maxMinutes: number): StepDraft[] {
  const targetMax = clampPlanEffort(maxMinutes);
  const normalized = steps.map((step) => ({
    ...step,
    estimatedMinutes: nearestAllowedMinutes(step.estimatedMinutes),
  }));

  while (totalMinutes(normalized) > targetMax) {
    const reducibleIndex = normalized
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.estimatedMinutes > 5)
      .sort((a, b) => b.step.estimatedMinutes - a.step.estimatedMinutes)[0]?.index;

    if (reducibleIndex === undefined) break;
    const current = normalized[reducibleIndex].estimatedMinutes;
    const next = [...ALLOWED_STEP_MINUTES]
      .reverse()
      .find((value) => value < current);
    normalized[reducibleIndex] = {
      ...normalized[reducibleIndex],
      estimatedMinutes: next ?? 5,
    };
  }

  return normalized;
}

function requiresApprovalFor(actionType: WorkspacePlanActionType) {
  return actionType === "continue" || actionType === "focus" || actionType === "plan" || actionType === "select";
}

function isOnboardingGoal(input: WorkspacePlannerEngineInput) {
  return input.goal.constraints.includes("Onboarding mode.");
}

function isCalmFocusGoal(input: WorkspacePlannerEngineInput) {
  return input.goal.title === "Create one useful block of focused progress.";
}

function hasPrimarySignal(input: WorkspacePlannerEngineInput) {
  return input.signals.some((signal) => signal.domain === input.goal.primaryDomain);
}

function confidenceForPlan(
  input: WorkspacePlannerEngineInput,
): WorkspacePriorityConfidence {
  if (!hasPrimarySignal(input) && !isOnboardingGoal(input)) {
    return input.goal.confidence === "high" ? "medium" : "low";
  }
  if (isCalmFocusGoal(input) && input.goal.confidence === "high") return "medium";
  return input.goal.confidence;
}

function step(
  title: string,
  description: string,
  domain: WorkspaceSignalDomain,
  actionType: WorkspacePlanActionType,
  estimatedMinutes: number,
  reason: string,
  targetRoute?: WorkspaceRoute,
  optional = false,
): StepDraft {
  return {
    title,
    description,
    domain,
    actionType,
    estimatedMinutes,
    reason,
    targetRoute,
    targetId: targetRoute,
    requiresApproval: requiresApprovalFor(actionType),
    optional,
  };
}

function draftsFor(input: WorkspacePlannerEngineInput): StepDraft[] {
  const domain = input.goal.primaryDomain;

  if (isOnboardingGoal(input)) {
    return [
      step("Open Tasks", "Add one meaningful task so SmartFlow can understand what matters.", "tasks", "open", 10, "Tasks create the first useful workspace signal.", "/tasks"),
      step("Choose one signal", "Start one learning activity or habit signal that reflects your day.", "learning", "select", 10, "A second signal helps avoid fake personalization.", "/learn-ai"),
      step("Open one core module", "Review a core module that matches what you want SmartFlow to support.", "documents", "open", 5, "Opening a module gives you a practical starting point.", "/documents"),
      step("Return to Workspace", "Come back after adding signals so the workspace can regenerate honestly.", "learning", "reflect", 5, "The next workspace should be based on real activity."),
    ];
  }

  if (isCalmFocusGoal(input)) {
    return [
      step("Choose one useful task", "Pick a single meaningful focus area for this session.", domain, "select", 5, "The current signal is weak, so the plan stays simple."),
      step("Work without interruption", "Use one focused block before adding more structure.", domain, "focus", 15, "A short focus block is safer than over-planning."),
      step("Review the result", "Check what changed and decide whether another block is useful.", domain, "reflect", 5, "Closing the loop keeps the plan lightweight."),
    ];
  }

  if (domain === "tasks") {
    return [
      step("Review active work", "Scan active and overdue tasks before choosing what to do.", "tasks", "review", 10, "Task load is the primary signal.", "/tasks"),
      step("Select the top two items", "Choose up to two important tasks for this plan.", "tasks", "select", 10, "Small selection prevents a long task list.", "/tasks"),
      step("Complete one focused work block", "Work on the selected task without mutating task status automatically.", "tasks", "focus", 45, "Focused work directly supports the goal.", "/tasks"),
      step("Review what remains", "Check the active list after the focus block.", "tasks", "reflect", 10, "Reviewing preserves control without marking anything complete.", "/tasks"),
    ];
  }

  if (domain === "calendar") {
    return [
      step("Review today's events", "Look over scheduled commitments for the day.", "calendar", "review", 10, "Calendar is the primary planning signal.", "/calendar"),
      step("Find free windows", "Identify conflicts and available focus windows.", "calendar", "select", 10, "The plan needs a realistic slot.", "/calendar"),
      step("Reserve a focus block conceptually", "Choose where focused work should fit without creating events.", "calendar", "plan", 20, "Planner V1 does not modify the calendar.", "/calendar"),
      step("Recheck before starting", "Review the day again before beginning the focus block.", "calendar", "reflect", 10, "A final check prevents schedule conflicts.", "/calendar"),
    ];
  }

  if (domain === "learning") {
    return [
      step("Resume the latest lesson", "Open the current learning thread and continue where possible.", "learning", "continue", 5, "Learning is the primary signal.", "/learn-ai"),
      step("Complete one learning block", "Study with attention for one focused block.", "learning", "focus", 25, "A bounded study block advances the goal.", "/learn-ai"),
      step("Review key points", "Summarize the useful ideas you want to keep.", "learning", "reflect", 10, "Reflection helps retain learning without changing progress data."),
      step("Choose the next lesson", "Pick the next learning direction without auto-starting it.", "learning", "select", 5, "Selection prepares the next session.", "/learn-ai", true),
    ];
  }

  if (domain === "finance") {
    return [
      step("Review recent activity", "Open finance and inspect recent entries without assuming a problem.", "finance", "review", 10, "Finance is the primary signal.", "/finance"),
      step("Identify one item", "Choose one item that may need attention.", "finance", "select", 10, "One item keeps the review focused.", "/finance"),
      step("Note one follow-up", "Write down the next follow-up conceptually without changing finance data.", "finance", "reflect", 10, "Planner V1 does not mutate finance records.", "/finance"),
    ];
  }

  if (domain === "habits") {
    return [
      step("Review today's routines", "Look at the habits that matter most today.", "habits", "review", 10, "Habit signal is the primary focus."),
      step("Choose one core habit", "Select the highest-value habit for today.", "habits", "select", 10, "One habit is easier to protect."),
      step("Plan a recovery block", "Choose a small recovery window if a routine was missed.", "habits", "plan", 15, "Planner V1 does not mark habits complete."),
      step("Reflect on consistency", "Review what made the routine easier or harder.", "habits", "reflect", 5, "Reflection supports future habit planning."),
    ];
  }

  return [
    step("Open the relevant document", "Open the most relevant recent document without inspecting hidden content.", "documents", "open", 10, "Documents are the primary signal.", "/documents"),
    step("Review available context", "Read the context that is already safely available to you.", "documents", "review", 15, "Planner V1 does not summarize document bodies."),
    step("Identify one next action", "Choose one follow-up action from the document context.", "documents", "select", 10, "One next action keeps the document workflow bounded.", "/documents"),
  ];
}

function materializeSteps(input: WorkspacePlannerEngineInput): WorkspacePlanStep[] {
  const drafts = normalizeEffort(
    draftsFor(input).slice(0, MAX_STEPS),
    input.goal.estimatedEffortMinutes,
  );
  const validDrafts = drafts.length < MIN_STEPS
    ? [
        ...drafts,
        step("Review the result", "Close the loop before moving on.", input.goal.primaryDomain, "reflect", 5, "Every plan needs a small closing step."),
      ]
    : drafts;

  return validDrafts.slice(0, MAX_STEPS).map((draft, index) => {
    const id = `plan-step:${slug(input.goal.id)}:${index + 1}`;
    const previousId = index > 0
      ? `plan-step:${slug(input.goal.id)}:${index}`
      : undefined;
    return {
      ...draft,
      id,
      order: index + 1,
      estimatedMinutes: nearestAllowedMinutes(draft.estimatedMinutes),
      status: "proposed",
      dependencies: previousId ? [previousId] : [],
    };
  });
}

export function plannerEngine(input: WorkspacePlannerEngineInput): WorkspacePlan {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const steps = materializeSteps(input);
  const totalEstimatedMinutes = Math.min(
    totalMinutes(steps),
    clampPlanEffort(input.goal.estimatedEffortMinutes),
  );

  return {
    id: `plan:${slug(input.goal.id)}:${slug(generatedAt.slice(0, 10))}`,
    goalId: input.goal.id,
    title: `Plan for: ${input.goal.title}`,
    summary: `A ${steps.length}-step proposed plan for today's goal.`,
    status: "proposed",
    steps,
    totalEstimatedMinutes,
    confidence: confidenceForPlan(input),
    constraints: [
      ...input.goal.constraints,
      "Planner V1 proposes steps only.",
      "No tools or workspace data are modified.",
    ],
    reasons: input.goal.reasons.slice(0, 4),
    generatedAt,
    sourceGoal: input.goal,
    sourceSignalIds: input.goal.sourceSignalIds,
  };
}
