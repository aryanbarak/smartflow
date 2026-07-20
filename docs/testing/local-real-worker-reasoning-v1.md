# Local Real-Worker Reasoning Boundary V1

## Purpose

SmartFlow has two distinct Worker HTTP paths:

- `POST /chat` is the existing stateful chat path. It loads Supabase-backed
  language, memory, and history; persists chat messages; updates the session;
  and may schedule memory extraction.
- `POST /agent/reason` is the local-QA-only stateless proposal path. It verifies
  a local Supabase bearer token, calls Gemini once, and returns a bounded intent
  proposal. It performs no database read beyond Auth verification and performs
  no database write.

The reasoning endpoint proposes only. Its response always enters the frontend
deterministic intent validator. It cannot approve, resolve, or execute a tool.

## Production Isolation

`/agent/reason` is available only when `SMARTFLOW_WORKER_MODE=local-qa`.
In that mode, `SUPABASE_URL` must be a credential-free loopback HTTP URL. A
missing, malformed, production, path-bearing, query-bearing, or deceptive
localhost URL fails closed. The endpoint never falls back to `/chat` or to a
deployed Worker.

The endpoint requires no `SUPABASE_SERVICE_KEY`. It does not load chat history,
persist messages, patch sessions, read memory, or trigger background work.

## Secure Worker Configuration

Copy `agent/worker/.dev.vars.example` to `agent/worker/.dev.vars`. The destination
is ignored by Git. Supply values locally without posting them in chat:

```dotenv
SMARTFLOW_WORKER_MODE=local-qa
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<local-public-anon-key>
GEMINI_API_KEY=<local-secret>
GEMINI_MODEL=gemini-2.5-flash
```

Verify secret-file isolation before starting:

```powershell
git check-ignore -v agent/worker/.dev.vars
git status --short
```

Do not put a service-role key, QA password, bearer token, cookie, or database
password in frontend environment files.

## Frontend Configuration

Use ignored `.env.local` values for authenticated local QA:

```dotenv
VITE_AGENT_REASONING_MODE=local-real-worker
VITE_AGENT_REASONING_WORKER_URL=http://127.0.0.1:8787
VITE_SMARTFLOW_SUPABASE_MODE=local-qa
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-public-anon-key>
```

`local-real-worker` rejects missing and non-loopback Worker URLs. It does not
use `VITE_AGENT_WORKER_URL` as a fallback. Existing production/default chat
behavior remains `stateful-chat`.

`deterministic-browser-stub` is a separate, development-only transport identity.
Evidence produced with fetch interception must keep
`proposalSource: deterministic-browser-stub`; it is not real-worker evidence.

## Startup

Start local Supabase and the frontend using the repository local-QA workflow.
Then start the Worker:

```powershell
cd agent/worker
npm run dev
```

The expected local origins are:

- App: `http://127.0.0.1:8080`
- Worker: `http://127.0.0.1:8787`
- Supabase API/Auth: `http://127.0.0.1:54321`

## Safe Smoke Checks

Preflight does not authenticate or invoke Gemini:

```powershell
Invoke-WebRequest `
  -Method OPTIONS `
  -Uri http://127.0.0.1:8787/agent/reason `
  -Headers @{ Origin = 'http://127.0.0.1:8080'; 'Access-Control-Request-Method' = 'POST' }
```

A POST without a bearer token must return `401`. A valid authenticated request
with no `GEMINI_API_KEY` must return `503` at the model boundary. Neither result
is proof of model execution.

Run one bounded synthetic authenticated request before any multilingual matrix.
The first successful real row must record:

- `proposalSource: local-real-worker`
- real, non-intercepted Worker transport
- local Supabase Auth verification
- one real model call
- the sanitized proposal envelope
- deterministic validator output
- layers exercised and excluded

Do not mark real-worker ARUX complete from preflight, authentication, unit tests,
or a deterministic browser stub.

## Validation Status

- One-row authenticated real-model smoke: **PASS**
- Synthetic request: inspect current tasks
- Proposal source: `local-real-worker`
- Model transport: one real Gemini request through the non-intercepted local Worker
- Deterministic result: `inspect_tasks` -> `tasks.list`
- Tool execution: none
- Persistence and production access: none
- Eight-row real-worker ARUX matrix: **PASS (8/8)**
- Canonical sanitized evidence:
  `docs/testing/evidence/real-worker-arux-matrix-v1.json`

The completed matrix validates local Auth, non-intercepted Worker transport,
one real Gemini proposal request per accepted row, runtime schema validation,
request correlation, deterministic intent mapping, English/German/Persian
response-language behavior, and Persian RTL presentation. It does not validate
tool execution, production deployment, autonomous behavior, or persistence.

## Real-Worker ARUX Matrix V1

The repository did not previously define a canonical eight-row real-worker
matrix. The following bounded synthetic prompts are fixed before execution.
Every row uses local Supabase Auth, the non-intercepted local `/agent/reason`
transport, exactly one real Gemini request, and deterministic validation. No
row authorizes or executes a tool.

| ID | Language | Synthetic prompt | Expected intent | Expected tool | Approval |
|---|---|---|---|---|---|
| RW-01 | EN | Show me my current tasks. | `inspect_tasks` | `tasks.list` | No |
| RW-02 | DE | Welche Termine habe ich heute? | `inspect_calendar` | `calendar.list_today` | No |
| RW-03 | FA | روند یادگیری من را نشان بده. | `inspect_learning` | `learning.get_progress` | No |
| RW-04 | EN | Summarize my current workspace. | `inspect_workspace` | `workspace.get_context` | No |
| RW-05 | EN | Mark "Local QA selected task" as done. | `complete_task` | `tasks.complete` | Required, but not granted |
| RW-06 | EN | Complete a task. | `ask_clarification` | None | No |
| RW-07 | DE | Lösche alle meine Aufgaben. | `unsupported` | None | No |
| RW-08 | FA | امروز چه کارهایی دارم؟ | `inspect_tasks` | `tasks.list` | No |

RW-05 uses a synthetic selected task in deterministic safe context. It validates
only exact-target binding, resolver output, and the approval requirement. The
matrix does not approve or run `tasks.complete`. German and Persian rows also
validate visible response language; Persian rows validate RTL presentation.

All eight rows passed. Each accepted row used `proposalSource: real-gemini`,
`networkTransport: local-real-worker`, and exactly one real Gemini request. The
evidence artifact separately records bounded runner attempts made before the
canonical row set was complete; those attempts are not hidden or relabeled as
accepted matrix rows. A passive browser response observer cloned the real
response for evidence but did not intercept, replace, or synthesize the request
or response transport.

## Logging and Privacy

The stateless endpoint logs only request ID, status, duration, outcome category,
and bounded response length. It does not log prompts, user messages, task titles,
tokens, keys, complete context, or model output.

Legacy `/chat` logging and persistence remain separate risks and are not changed
by this boundary.

## Credential Removal

After validation, delete `agent/worker/.dev.vars` and rotate or revoke the local
Gemini credential through the provider account. Confirm the secret file never
appeared in `git status` or Git history.
