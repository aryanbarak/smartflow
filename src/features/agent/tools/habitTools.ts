import type { AgentToolDefinition } from "../toolTypes";

export const habitTools: AgentToolDefinition[] = [
  {
    id: "habits.mark_complete",
    name: "Mark habit complete",
    description: "Future contract for marking a habit complete after explicit approval.",
    domain: "habits",
    capability: "complete",
    mode: "write",
    riskLevel: "medium",
    requiresApproval: true,
    approvalScope: "single_step",
    reversible: true,
    externalEffect: true,
    inputSchema: [
      {
        name: "habitId",
        type: "string",
        required: true,
        description: "Habit identifier.",
      },
      {
        name: "date",
        type: "date",
        required: false,
        description: "Completion date.",
      },
    ],
    outputSchema: {
      type: "object",
      description: "Habit completion metadata.",
      fields: [],
    },
    enabled: true,
    version: "1.0.0",
    tags: ["future", "habits", "write"],
    examples: [
      {
        title: "Complete a habit",
        input: { habitId: "habit-1" },
        expectedOutcome: "Marks the habit complete only after explicit approval in a future executor.",
      },
    ],
    constraints: ["Contract only.", "No handler is registered.", "Requires explicit user approval."],
  },
];
