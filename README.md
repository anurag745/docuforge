# Docuforge (documentai)

A combined FastAPI + React app for AI-assisted document and presentation authoring. This repository contains a backend (FastAPI) and a frontend (Vite + React). The backend supports AI generation (mock + OpenAI-ready), JWT auth, project/section persistence, and PPTX export using python-pptx.

## Quick summary
- Backend: `backend/` — FastAPI app, async SQLAlchemy, Pydantic schemas, LLM service, PPTX generator (`pptx_builder.py`).
- Frontend: `frontend/` — Vite + React + TypeScript, Zustand stores, Tiptap editor.

---

## Prerequisites
- Python 3.10+ (3.11 recommended)
- Node 18+ / npm 9+ (or yarn/pnpm)
- (optional) An OpenAI API key if you want real LLM generation (otherwise USE_MOCK=true)

## Installation & setup

1. Clone the repository

```bash
git clone <repo-url>
cd documentai
```

2. Backend — create virtualenv and install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Frontend — install node dependencies

```bash
cd ../frontend
npm install
# or `pnpm install` / `yarn`
```

## Environment variables

Create a `.env` file in the `backend/` folder (this repo contains `.env.example`). Important variables:

- `DATABASE_URL` — SQLAlchemy connection string. Example: `sqlite+aiosqlite:///./dev.db` (default development uses sqlite)
- `JWT_SECRET` — secret used for signing JWT tokens (set to a long random string in production)
- `JWT_ALGORITHM` — usually `HS256` (default)
- `OPENAI_API_KEY` — (optional) your OpenAI API key. If set, the backend will prefer OpenAI calls; otherwise it uses MOCK mode.
- `OPENAI_MODEL` — optional, e.g., `gpt-4o` or `gpt-3.5-turbo`
- `USE_MOCK` — set to `true` to force mock LLM behavior (overrides real API)
- `FRONTEND_URLS` — comma-separated list of allowed origins for CORS (e.g., `http://localhost:5173`)

Example `.env` (do NOT commit this file):

```env
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=replace-with-a-secure-secret
OPENAI_API_KEY=
USE_MOCK=true
FRONTEND_URLS=http://localhost:5173
```

## How to run

Backend (development, reload enabled):

```bash
cd backend
source .venv/bin/activate
# ensure your .env exists and is loaded by app/main.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (development):

```bash
cd frontend
npm run dev
# open http://localhost:5173 (or the port Vite reports)
```

To build the frontend for production:

```bash
cd frontend
npm run build
```

## PPTX export
The backend exposes POST `/api/projects/generate_pptx` which accepts a `DeckModel` (JSON) and streams back a `.pptx`. The frontend has a TemplatePicker UI and an export flow which will POST the deck to this endpoint and download the resulting file.

If you want predictable, exact styling across viewers we recommend using an actual `.pptx` master template and mapping placeholders; python-pptx can then fill placeholders exactly.

## Running tests

If pytest tests exist, run:

```bash
cd backend
source .venv/bin/activate
pytest -q
```

## Notes & troubleshooting
- If your PPTX looks plain white: ensure the frontend sends a template in the `DeckModel` or the backend falls back to a built-in template. Check backend logs for the message `Building PPTX: ... template=...`.
- If fonts appear wrong: the PPTX references font names but the final rendering depends on fonts installed on the viewer machine (PowerPoint/LibreOffice). Embedding fonts is not handled by python-pptx; for pixel-perfect results consider rendering text as images or using a `.pptx` master file with embedded assets.
- If OpenAI calls fail: ensure `OPENAI_API_KEY` is set and reachable; you can also force `USE_MOCK=true` to avoid real API calls during development.

## Contact / Next steps
- Add a `.pptx` master template and map template JSON to placeholders for exact styling.
- Add DOM sanitization (server-side) before rendering arbitrary HTML into slides.

---

Files of interest:
- `backend/app/pptx_builder.py` — builds .pptx from DeckModel
- `backend/app/services/llm_service.py` — LLM abstraction (mock + OpenAI)
- `frontend/src/components/TemplatePicker.tsx` — template selection UI
