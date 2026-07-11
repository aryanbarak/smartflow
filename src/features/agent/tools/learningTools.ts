import type { AgentToolDefinition } from "../toolTypes";

export const learningTools: AgentToolDefinition[] = [
  {
    id: "learning.get_progress",
    name: "Get learning progress",
    description: "Inspect learning progress metadata for workspace continuity.",
    domain: "learning",
    capability: "inspect",
    mode: "read",
    riskLevel: "none",
    requiresApproval: false,
    approvalScope: "view_only",
    reversible: true,
    externalEffect: false,
    inputSchema: [],
    outputSchema: {
      type: "object",
      description: "Learning progress metadata.",
      fields: [
        {
          name: "progress",
          type: "number",
          required: false,
          description: "Completion percentage when available.",
        },
      ],
    },
    enabled: true,
    version: "1.0.0",
    tags: ["workspace", "learning", "read"],
    examples: [
      {
        title: "Inspect learning continuity",
        input: {},
        expectedOutcome: "Returns learning progress metadata.",
      },
    ],
    constraints: ["Read-only contract.", "Does not create learning records."],
  },
];
