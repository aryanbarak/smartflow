import type { AgentToolDefinition } from "../toolTypes";

export const documentTools: AgentToolDefinition[] = [
  {
    id: "documents.list_recent",
    name: "List recent documents",
    description: "Inspect recent document metadata without reading document bodies.",
    domain: "documents",
    capability: "inspect",
    mode: "read",
    riskLevel: "low",
    requiresApproval: false,
    approvalScope: "view_only",
    reversible: true,
    externalEffect: false,
    inputSchema: [],
    outputSchema: {
      type: "array",
      description: "Recent document metadata only.",
      containsSensitiveData: true,
    },
    enabled: true,
    version: "1.0.0",
    tags: ["workspace", "documents", "read", "metadata-only"],
    examples: [
      {
        title: "Inspect recent documents",
        input: {},
        expectedOutcome: "Returns document titles and timestamps, not document bodies.",
      },
    ],
    constraints: [
      "Read-only contract.",
      "Document bodies are out of scope for Tool Registry V1.",
      "May expose sensitive filenames, so the risk is classified as low.",
    ],
  },
  {
    id: "documents.delete",
    name: "Delete document",
    description: "Future contract for deleting a document after explicit approval.",
    domain: "documents",
    capability: "delete",
    mode: "write",
    riskLevel: "high",
    requiresApproval: true,
    approvalScope: "single_step",
    reversible: false,
    externalEffect: true,
    inputSchema: [
      {
        name: "documentId",
        type: "string",
        required: true,
        description: "Document identifier.",
        sensitive: true,
      },
    ],
    outputSchema: {
      type: "object",
      description: "Deleted document metadata.",
      fields: [],
    },
    enabled: true,
    version: "1.0.0",
    tags: ["future", "documents", "write", "destructive"],
    examples: [
      {
        title: "Delete a document",
        input: { documentId: "document-1" },
        expectedOutcome: "Deletes only after explicit approval in a future executor.",
      },
    ],
    constraints: [
      "Contract only.",
      "No handler is registered.",
      "Requires explicit user approval.",
      "Irreversible destructive action.",
    ],
  },
];
