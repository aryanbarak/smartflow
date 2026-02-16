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
