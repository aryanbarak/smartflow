# FIAE Tutor

Documentation now lives in `docs/`.

- Getting started: `docs/user/quickstart.md`
- Quick reference: `docs/user/quick_reference.md`
- Full guide: `docs/user/readme.md`

## Tutor Static Pipeline

This project can prepare static tutor content under `public/tutor` by calling the real exporter from `fiae-tutor-core`.

- `npm run tutor:export`: runs `C:\Projects\fiae-workspace\fiae-tutor-core\.venv\Scripts\python.exe -m fiae_tutor.export.tutor_static --out export\tutor` in `C:\Projects\fiae-workspace\fiae-tutor-core`
- `npm run tutor:sync`: copies `C:\Projects\fiae-workspace\fiae-tutor-core\export\tutor\*` to `C:\Projects\fiae-workspace\dailyflow\public\tutor\` (after cleaning old content)
- `npm run tutor:verify`: checks required files:
  - `public\tutor\manifest.json`
  - `public\tutor\index.json`
  - `public\tutor\topics\exam_bank_ap2\exam.de.v1.json`
- `npm run tutor:prep`: export + sync + verify
- `npm run dev:tutor`: tutor prep, then Vite dev server
- `npm run build:tutor`: tutor prep, then Vite production build

## Tutor App (Local)
1. Start adapter on `127.0.0.1:8000`:
   - `cd C:\Projects\fiae-workspace\dailyflow-tutor-adapter`
   - `powershell -ExecutionPolicy Bypass -File .\scripts\dev-run.ps1`
2. Configure `dailyflow/.env.local`:
   - `VITE_TUTOR_API_URL=http://127.0.0.1:8000`
   - `VITE_TUTOR_API_TOKEN=dev-secret`
3. Run DailyFlow:
   - `cd C:\Projects\fiae-workspace\dailyflow`
   - `npm install`
   - `npm run dev:tutor`
4. Open:
   - `http://localhost:8080/tutor/app`
   - If Vite picks another port, use the URL printed in terminal.
