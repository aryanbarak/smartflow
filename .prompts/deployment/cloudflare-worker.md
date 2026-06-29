# Cloudflare Worker Deployment — smartFlow AI Worker

## Worker Info
- Name: smartflow-ai-worker
- URL: https://api.barakzai.cloud/analyze
- Runtime: Cloudflare Workers (Edge)
- AI: Google Gemini 2.5 Flash
- CORS: hardcoded to https://barakzai.cloud only

## Directory
```bash
cd smartflow-ai-worker
```

## Deploy Commands
```bash
# Deploy
npx wrangler deploy

# Live logs
npx wrangler tail

# Set/update secret
npx wrangler secret put GEMINI_API_KEY

# Local dev (CORS allows localhost in dev mode)
npx wrangler dev
```

## Secrets Required

| Secret | Set via |
|--------|---------|
| `GEMINI_API_KEY` | `npx wrangler secret put GEMINI_API_KEY` |

## ⚠️ Important Notes
- Worker has NO CI/CD — deploy manually with `wrangler deploy`
- Worker source is in `smartflow-ai-worker/` (not version controlled)
- CORS only allows `barakzai.cloud` — localhost requests blocked in production
- Use `wrangler dev` for local testing

## Troubleshooting
- 429 error → rate limit hit, wait or check Gemini quota
- 503 error → Gemini API key expired or quota exceeded
  → Run: `npx wrangler secret put GEMINI_API_KEY`
- CORS error in dev → use `wrangler dev` locally

## Task:
[DESCRIBE WORKER TASK OR ISSUE HERE]
