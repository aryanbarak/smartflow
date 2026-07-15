# SmartFlow Assistants

This directory stores version-controlled Custom GPT configuration for SmartFlow assistants.

The live GPT configuration is not updated automatically from this repository. After changing these files, the corresponding Custom GPT must still be updated manually in ChatGPT.

Project documentation remains in its canonical repository locations. The `knowledge.md` files in each assistant directory are manifests only; they list the repository files that should later be uploaded manually to GPT Knowledge. They are not copies of those documents and should not be uploaded themselves.

Material documentation changes may require manual re-upload to GPT Knowledge. After re-verifying a manifest, update its `Last Verified` date. Every assistant configuration change must also be recorded in that assistant's `changelog.md`.

| Assistant | Primary Responsibility | Configuration Directory |
| --- | --- | --- |
| SmartFlow System Architect | Long-term architecture governance and boundary review | `assistants/smartflow-system-architect/` |
| SmartFlow Agent Engineer | Safe implementation of agent pipeline contracts and runtime boundaries | `assistants/smartflow-agent-engineer/` |
| SmartFlow QA & Audit | Strict requirement, safety, architecture and regression review | `assistants/smartflow-qa-audit/` |
