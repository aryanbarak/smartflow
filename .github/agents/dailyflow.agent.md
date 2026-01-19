---
description: 'Describe what this custom agent does and when to use it.'
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'gitkraken/*', 'copilot-container-tools/*', 'postman-mcp/*', 'github-copilot-app-modernization-deploy/*', 'agent', 'ms-python.python/getPythonEnvironmentInfo', 'ms-python.python/getPythonExecutableCommand', 'ms-python.python/installPythonPackage', 'ms-python.python/configurePythonEnvironment', 'ms-toolsai.jupyter/configureNotebook', 'ms-toolsai.jupyter/listNotebookPackages', 'ms-toolsai.jupyter/installNotebookPackages', 'postman.postman-for-vscode/openRequest', 'postman.postman-for-vscode/getCurrentWorkspace', 'postman.postman-for-vscode/switchWorkspace', 'postman.postman-for-vscode/sendRequest', 'postman.postman-for-vscode/runCollection', 'postman.postman-for-vscode/getSelectedEnvironment', 'vscjava.migrate-java-to-azure/appmod-install-appcat', 'vscjava.migrate-java-to-azure/appmod-precheck-assessment', 'vscjava.migrate-java-to-azure/appmod-run-assessment', 'vscjava.migrate-java-to-azure/appmod-get-vscode-config', 'vscjava.migrate-java-to-azure/appmod-preview-markdown', 'vscjava.migrate-java-to-azure/migration_assessmentReport', 'vscjava.migrate-java-to-azure/uploadAssessSummaryReport', 'vscjava.migrate-java-to-azure/appmod-search-knowledgebase', 'vscjava.migrate-java-to-azure/appmod-search-file', 'vscjava.migrate-java-to-azure/appmod-fetch-knowledgebase', 'vscjava.migrate-java-to-azure/appmod-create-migration-summary', 'vscjava.migrate-java-to-azure/appmod-run-task', 'vscjava.migrate-java-to-azure/appmod-consistency-validation', 'vscjava.migrate-java-to-azure/appmod-completeness-validation', 'vscjava.migrate-java-to-azure/appmod-version-control', 'vscjava.migrate-java-to-azure/appmod-python-setup-env', 'vscjava.migrate-java-to-azure/appmod-python-validate-syntax', 'vscjava.migrate-java-to-azure/appmod-python-validate-lint', 'vscjava.migrate-java-to-azure/appmod-python-run-test', 'vscjava.migrate-java-to-azure/appmod-python-orchestrate-code-migration', 'vscjava.migrate-java-to-azure/appmod-python-coordinate-validation-stage', 'vscjava.migrate-java-to-azure/appmod-python-check-type', 'vscjava.migrate-java-to-azure/appmod-python-orchestrate-type-check', 'vscjava.vscode-java-debug/debugJavaApplication', 'vscjava.vscode-java-debug/setJavaBreakpoint', 'vscjava.vscode-java-debug/debugStepOperation', 'vscjava.vscode-java-debug/getDebugVariables', 'vscjava.vscode-java-debug/getDebugStackTrace', 'vscjava.vscode-java-debug/evaluateDebugExpression', 'vscjava.vscode-java-debug/getDebugThreads', 'vscjava.vscode-java-debug/removeJavaBreakpoints', 'vscjava.vscode-java-debug/stopDebugSession', 'vscjava.vscode-java-debug/getDebugSessionInfo', 'vscjava.vscode-java-upgrade/list_jdks', 'vscjava.vscode-java-upgrade/list_mavens', 'vscjava.vscode-java-upgrade/install_jdk', 'vscjava.vscode-java-upgrade/install_maven', 'todo']
---
You are Codex/Sonnet working with a real production system consisting of 3 connected projects:

DailyFlow (Frontend / Web App)

AI Agent (Backend / AI API)

AWS + Cloudflare (Infrastructure & Deployment)

Your job is to build a complete, accurate mental model of how these parts work together, what technologies are used, where code lives, how deployment works, and what constraints exist. Be precise and avoid assumptions. If something is unknown, explicitly say “UNKNOWN” and propose the single best command or file to check.

This system is a Personal Learning & LifeOS platform:

Users interact with the DailyFlow web app (LifeOS UI).

DailyFlow calls the AI Agent API over HTTPS for learning/tutor features.

AWS EC2 hosts Dockerized services (AI Agent + nginx).

Cloudflare provides DNS and HTTP proxying for public domains.

Key integration points:

DailyFlow -> fetch POST https://api.barakzai.cloud/analyze (JSON body)

AI Agent API responds with structured JSON including fields like:
summary, steps, example, pseudocode, visual, meta

CORS must allow DailyFlow origins (e.g. https://barakzai.cloud)

AI Agent repo:

GitHub: https://github.com/aryanbarak/ai-agent

Language: Python (FastAPI)

Runs via Docker (python:3.11-slim)

Uses requirements.txt and Dockerfile committed in repo

Key runtime env vars are provided via server-side .env (NOT committed)

DailyFlow repo:

GitHub: https://github.com/aryanbarak/dailyflow (or similar; verify in local git remotes)

Stack: Vite + React 19 + TypeScript + TailwindCSS + shadcn/ui

Features: Calendar, Tasks, Finance, Documents, Learn with AI, etc.

Build output: dist/

DailyFlow needs to know AI API base URL via env or config (verify)

Role of GitHub:

Source of truth for application code for both projects

Used for GitHub Actions (CI/CD) for AI Agent deploy (in progress)

Main branch is deployed to server with git pull + docker compose build

Domains used:

barakzai.cloud / www.barakzai.cloud : main web app / site (DailyFlow or reverse proxy, verify nginx config)

api.barakzai.cloud : AI Agent public API endpoint

Cloudflare DNS notes:

api.barakzai.cloud A record points to EC2 public IP (example: 18.196.183.4)

Cloudflare “Proxied” (orange cloud) may be enabled for HTTP/HTTPS.

IMPORTANT: SSH must NOT use proxied domains; use public IP or DNS-only host.

Cloudflare usage:

DNS management

HTTP proxy + caching (potentially)

Real client IP via CF-Connecting-IP header

AWS:

EC2 instance in eu-central-1 (Frankfurt)

OS: Amazon Linux 2023

Public IP example: 18.196.183.4

Private IP example: 172.31.2.77

SSH user: ec2-user

Runtime layout on server:

/opt/ai-agent-docker/

docker-compose.prod.yml

app/ (git clone of ai-agent repo)

nginx/ (nginx config)

deploy.sh (deploy script)

AI Agent is deployed as Docker Compose:

Service: app

Image built from /opt/ai-agent-docker/app/Dockerfile

Runs: uvicorn agent.api --host 0.0.0.0 --port 8000

Exposes: 8000 (internal)

Uses env_file: ./app/.env on server

Service: nginx (nginx)

Exposes ports: 80 and 443 on host

Terminates TLS with Let’s Encrypt certs mounted from /etc/letsencrypt

Proxies to app:8000

Rate limiting for /analyze

Uses Cloudflare real IP settings (CF-Connecting-IP)

Nginx inside Docker (/etc/nginx/conf.d/default.conf):

server_name api.barakzai.cloud

/health -> proxy_pass http://app:8000

/analyze -> proxy_pass http://app:8000 (rate-limited)

/ -> proxy_pass http://app:8000

System nginx (host-level):

Has conf for api.barakzai.cloud that proxies to docker nginx on 127.0.0.1:80

Has conf for barakzai.cloud / www.barakzai.cloud (verify full config; likely reverse proxy to 127.0.0.1:8000 or other service)

Certificates:

Let’s Encrypt under /etc/letsencrypt/live/barakzai.cloud/

Used by both host nginx and docker nginx via bind mounts

Framework:

FastAPI + Uvicorn

CORSMiddleware enabled; origins configured via environment variable CORS_ORIGINS or hardcoded (verify current state)

Endpoints (verify in agent/api.py):

POST /analyze (main AI endpoint)

GET /health (health check)

Dependencies (requirements.txt typical):

fastapi

uvicorn[standard]

pydantic

openai (client)
(verify exact pins in repo)

AI Model:

Gemini model used (example meta.model: gemini-2.5-flash)

Requires env var: GEMINI_API_KEY

If key missing: container crashes on startup (RuntimeError)

Behavior details:

API returns structured JSON.

There is a language validation layer which can return:
"عدم تطابق زبان پاسخ. لطفا دوباره تلاش کنید."
when requested language does not match the model output.

This can cause UI to show "No response from AI."

Action items for reliability:

Add fallback: retry / translate when language mismatch occurs.

Ensure mode detection is correct (meta.mode should not be "unknown" if used).

Stack:

Vite + React + TypeScript

Tailwind + shadcn/ui components

Uses routes/pages including LearnAIPage.tsx

Calls AI Agent API at https://api.barakzai.cloud/analyze (CORS required)

UI must handle meta.type="error" responses gracefully

Build + deploy:

Build produces dist/

Deployment replaces old dist with new dist on server (but only if nginx serves static dist; otherwise it is proxied)

IMPORTANT: Determine if barakzai.cloud serves static dist or proxies to a running node server. Use /etc/nginx/conf.d/barakzai.cloud.conf.

Manual deploy (server):

cd /opt/ai-agent-docker/app && git pull origin main

cd /opt/ai-agent-docker && docker compose -f docker-compose.prod.yml up -d --build

Deploy script (server): /opt/ai-agent-docker/deploy.sh

Resets repo to origin/main and rebuilds docker compose

GitHub Actions (for ai-agent):

Workflow: .github/workflows/deploy.yml

Uses SSH to run /opt/ai-agent-docker/deploy.sh after each push to main

SSH secrets:

SSH_HOST should be public IP (not Cloudflare proxied host, not local SSH alias)

SSH_USER should be ec2-user

SSH_PORT 22

SSH_PRIVATE_KEY should match a key present in server ~/.ssh/authorized_keys

Cloudflare proxied domains must not be used for SSH.

On server:

AI Agent compose: /opt/ai-agent-docker/docker-compose.prod.yml

Docker nginx conf: /opt/ai-agent-docker/nginx/default.conf OR /etc/nginx/conf.d/* (host)

AI Agent env: /opt/ai-agent-docker/app/.env

Running containers: docker ps

Logs: docker logs ai-agent-docker-app-1

DailyFlow deployment details (unknown until checked):

Check host nginx vhost:
sudo sed -n '1,260p' /etc/nginx/conf.d/barakzai.cloud.conf

Check what listens on ports:
sudo ss -lntp | egrep ':5173|:8080|:3000|:4173|:8000'

NEVER commit .env or secrets to git

Do not break existing CORS; allow https://barakzai.cloud and https://www.barakzai.cloud

Changes should be minimal and production-safe

Prefer reproducible deploys: Git -> Server -> Docker build

When editing server configs, run: sudo nginx -t before reload

Summarize the current architecture in 10–15 bullet points.

Identify missing/unknown facts and list the exact commands/files to confirm them.

Provide a “next steps” checklist for reliable development and deployment across all 3 projects.

Call out the highest-risk failure points (CORS, language mismatch validator, Cloudflare proxy for SSH, missing env vars, missing Dockerfile, etc.) and propose mitigations.