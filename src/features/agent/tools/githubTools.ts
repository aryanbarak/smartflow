import type { AgentToolDefinition } from "../toolTypes";

export const githubTools: AgentToolDefinition[] = [
  {
    id: "github.repositories.list",
    name: "List connected GitHub repositories",
    description: "List bounded repository metadata from the user's verified GitHub App installation.",
    domain: "github",
    capability: "read",
    mode: "read",
    riskLevel: "none",
    requiresApproval: false,
    approvalScope: "view_only",
    reversible: true,
    externalEffect: false,
    inputSchema: [],
    outputSchema: {
      type: "object",
      description: "At most 20 sanitized repository metadata records.",
      fields: [
        {
          name: "repositories",
          type: "array",
          required: true,
          description: "Sanitized repository identifiers, names, owners, visibility, default branches, and archived flags.",
        },
      ],
      containsSensitiveData: false,
    },
    enabled: true,
    version: "1.0.0",
    tags: ["github", "repositories", "read", "bounded"],
    examples: [
      {
        title: "Inspect connected repositories",
        input: {},
        expectedOutcome: "Returns up to 20 repositories granted to the verified GitHub App installation.",
      },
    ],
    constraints: [
      "Read-only contract.",
      "Uses authenticated runtime identity only.",
      "Does not accept installation IDs, URLs, paths, tokens, or pagination input.",
      "Does not read source files, commits, branches, issues, pull requests, checks, or actions.",
    ],
  },
  {
    id: "github.issues.list",
    name: "List open GitHub issues",
    description: "List bounded open-issue metadata across the user's verified GitHub App installation.",
    domain: "github",
    capability: "read",
    mode: "read",
    riskLevel: "none",
    requiresApproval: false,
    approvalScope: "view_only",
    reversible: true,
    externalEffect: false,
    inputSchema: [],
    outputSchema: {
      type: "object",
      description: "At most 20 sanitized open-issue records across at most 3 scanned repositories.",
      fields: [
        {
          name: "issues",
          type: "array",
          required: true,
          description: "Sanitized repo, issue number, title, state, and last-updated timestamp. No bodies, comments, or user identities.",
        },
      ],
      containsSensitiveData: false,
    },
    enabled: true,
    version: "1.0.0",
    tags: ["github", "issues", "read", "bounded"],
    examples: [
      {
        title: "Inspect open issues",
        input: {},
        expectedOutcome: "Returns up to 20 open issues across up to 3 repositories granted to the verified GitHub App installation.",
      },
    ],
    constraints: [
      "Read-only contract.",
      "Uses authenticated runtime identity only.",
      "Does not accept installation IDs, URLs, paths, tokens, or pagination input.",
      "Excludes pull requests, issue bodies, comments, labels, assignees, and user identities.",
      "Does not read source files, commits, branches, checks, or actions.",
    ],
  },
];
