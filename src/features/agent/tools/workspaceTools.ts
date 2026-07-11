import type { AgentToolDefinition } from "../toolTypes";

export const workspaceTools: AgentToolDefinition[] = [
  {
    id: "workspace.get_context",
    name: "Get workspace context",
    description: "Inspect the deterministic workspace context already available in the frontend.",
    domain: "workspace",
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
      description: "Current workspace context model.",
      fields: [],
    },
    enabled: true,
    version: "1.0.0",
    tags: ["workspace", "context", "read"],
    examples: [
      {
        title: "Inspect workspace context",
        input: {},
        expectedOutcome: "Returns the current typed workspace context.",
      },
    ],
    constraints: ["Read-only contract.", "Does not call AI services or network APIs."],
  },
];
