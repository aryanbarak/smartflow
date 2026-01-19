# DailyFlow 🚀

Local-first MVP for tasks, calendar, and finance tracking. This build uses a demo auth session stored in `localStorage` and does not connect to Supabase.

> **✨ Now with automated GitHub Actions deployment!** Every push to `main` automatically deploys to production.

## Requirements

- Node.js 18+
- npm

## Setup

```sh
npm install
npm run dev
```

## Build & Preview

```sh
npm run build
npm run preview
```

## Project Structure

- `src/pages`: Route pages (Dashboard, Tasks, Calendar, Finance, Settings)
- `src/hooks`: Local-only hooks (`useAuth`, `useTasks`, `useEvents`, `useFinance`, `usePreferences`)
- `src/features`: Local data services (CRUD + persistence)
- `src/lib`: Storage/date helpers

## Local-Only Data Storage

All data is stored in `localStorage` under the `dailyflow:v1:` prefix.

To reset the app data, clear site storage in your browser or remove the `dailyflow:v1:*` keys.


## Environment Variables

This MVP runs without secrets. See `.env.example` for an optional example.

## Supabase (future)

This project can be extended to use Supabase later. Add your Supabase env variables and wire the services to the API layer when you are ready.

---

## 🚀 Deployment

This project uses **GitHub Actions** for automated deployment to AWS EC2:

- **Production URL**: https://barakzai.cloud
- **API**: https://api.barakzai.cloud
- **Auto-deploy**: Every push to `main` triggers deployment
- **Zero-downtime**: Atomic symlink deployment with rollback support

See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for complete deployment documentation.
