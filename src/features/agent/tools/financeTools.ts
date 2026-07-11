import type { AgentToolDefinition } from "../toolTypes";

export const financeTools: AgentToolDefinition[] = [
  {
    id: "finance.create_transaction",
    name: "Create transaction",
    description: "Future contract for creating a finance transaction after explicit approval.",
    domain: "finance",
    capability: "create",
    mode: "write",
    riskLevel: "high",
    requiresApproval: true,
    approvalScope: "single_step",
    reversible: false,
    externalEffect: true,
    inputSchema: [
      {
        name: "amount",
        type: "number",
        required: true,
        description: "Transaction amount.",
        sensitive: true,
      },
      {
        name: "type",
        type: "enum",
        required: true,
        description: "Transaction type.",
        enumValues: ["income", "expense"],
      },
      {
        name: "date",
        type: "date",
        required: true,
        description: "Transaction date.",
      },
    ],
    outputSchema: {
      type: "object",
      description: "Created transaction metadata.",
      fields: [],
      containsSensitiveData: true,
    },
    enabled: true,
    version: "1.0.0",
    tags: ["future", "finance", "write", "sensitive"],
    examples: [
      {
        title: "Record expense",
        input: { amount: 12.5, type: "expense", date: "2026-07-12" },
        expectedOutcome: "Creates a transaction only after explicit approval in a future executor.",
      },
    ],
    constraints: [
      "Contract only.",
      "No handler is registered.",
      "Requires explicit user approval.",
      "Classified conservatively as not reversible.",
    ],
  },
];
