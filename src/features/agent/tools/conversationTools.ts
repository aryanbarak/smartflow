import type { AgentToolDefinition } from "../toolTypes";

export const conversationTools: AgentToolDefinition[] = [
  {
    id: "messages.send",
    name: "Send message",
    description: "Future contract for sending a message after explicit approval.",
    domain: "conversations",
    capability: "send",
    mode: "write",
    riskLevel: "high",
    requiresApproval: true,
    approvalScope: "single_step",
    reversible: false,
    externalEffect: true,
    inputSchema: [
      {
        name: "recipient",
        type: "string",
        required: true,
        description: "Message recipient.",
        sensitive: true,
      },
      {
        name: "body",
        type: "string",
        required: true,
        description: "Message body.",
        sensitive: true,
      },
    ],
    outputSchema: {
      type: "object",
      description: "Sent message metadata.",
      fields: [
        {
          name: "messageId",
          type: "string",
          required: true,
          description: "Sent message identifier.",
        },
      ],
    },
    enabled: true,
    version: "1.0.0",
    tags: ["future", "conversations", "write", "external-effect"],
    examples: [
      {
        title: "Send a message",
        input: { recipient: "contact@example.com", body: "Following up." },
        expectedOutcome: "Sends only after explicit approval in a future executor.",
      },
    ],
    constraints: [
      "Contract only.",
      "No handler is registered.",
      "Requires explicit user approval.",
      "Irreversible external effect.",
    ],
  },
];
