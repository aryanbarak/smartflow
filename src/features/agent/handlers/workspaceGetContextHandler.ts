import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const workspaceGetContextHandler: AgentToolHandler = {
  toolId: "workspace.get_context",
  timeoutMs: 1000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  execute(_input, context) {
    const workspace = context.workspace;
    if (!workspace) {
      return {
        workspace: null,
      };
    }

    return {
      workspace: {
        goal: {
          title: workspace.goal.title,
          summary: workspace.goal.summary,
          primaryDomain: workspace.goal.primaryDomain,
          supportingDomains: workspace.goal.supportingDomains,
          confidence: workspace.goal.confidence,
        },
        plan: {
          title: workspace.plan.title,
          summary: workspace.plan.summary,
          stepCount: workspace.plan.steps.length,
          totalEstimatedMinutes: workspace.plan.totalEstimatedMinutes,
          confidence: workspace.plan.confidence,
        },
        priority: {
          primaryDomain: workspace.goal.primaryDomain,
          secondaryDomains: workspace.goal.supportingDomains,
          confidence: workspace.goal.confidence,
        },
        signals: workspace.signalFeed.map((signal) => ({
          id: signal.id,
          domain: signal.domain,
          label: signal.label,
          severity: signal.severity,
          reason: signal.reason,
          count: signal.count,
        })),
      },
    };
  },
};
