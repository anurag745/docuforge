# Backend (FastAPI)

This backend serves the React frontend in `../frontend`. It provides auth, project management, mock LLM endpoints and export functionality.

Quick start

1. Create a Python 3.10+ virtualenv and install:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and edit values if needed.

3. Start the app:

```bash
uvicorn app.main:app --reload --port 8000
```

4. Frontend .env example:

```env
# in frontend .env
VITE_API_BASE_URL=http://localhost:8000/api
```

Mock mode

Set `USE_MOCK=true` in `.env` to enable deterministic mock LLM outputs.

Docs

Open http://localhost:8000/docs for Swagger UI.

Migrations

Alembic is included as a dependency. For a simple dev flow we create tables automatically on startup. To use alembic, initialize and configure it to point to the database URL in `.env`.

API Endpoints

Base URL: http://localhost:8000/api

Authentication

- POST /api/auth/signup
  - Body (JSON): { "name": string, "email": string, "password": string }
  - Response: created user object (no token). Example:

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret"}'
```

- POST /api/auth/login
  - Body (JSON): { "email": string, "password": string }
  - Response: { "token": string, "user": { ... } }

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'
```

- GET /api/auth/me
  - Headers: Authorization: Bearer <token>
  - Response: { "id": number, "email": string }

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/me
```

Notes:
- Use the login endpoint to obtain a JWT token. Protected endpoints require the header `Authorization: Bearer <token>`.

Project Management

- GET /api/projects
  - Headers: Authorization: Bearer <token>
  - Response: list of projects belonging to the authenticated user

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/projects
```

- POST /api/projects
  - Headers: Authorization: Bearer <token>
  - Body (JSON):
    {
      "title": "Project Title",
      "docType": "docx" | "pptx",
      "topic": "optional topic",
      "scaffold": "optional scaffold content"
    }
  - Response: created project object

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"My Project","docType":"docx","topic":"AI","scaffold":"Intro"}'
```

- GET /api/projects/{id}
  - Headers: Authorization: Bearer <token>
  - Response: full project object including sections

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/projects/1
```

LLM Features (mock / service layer)

- POST /api/projects/{id}/generate
  - Headers: Authorization: Bearer <token>
  - Body (JSON): { "sectionId": number (optional), "slideIndex": number (optional) }
  - Response: { "text": string, "generationId": string, "meta": {...} }

```bash
curl -X POST http://localhost:8000/api/projects/1/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sectionId":1,"slideIndex":0}'
```

- POST /api/projects/{id}/refine
  - Headers: Authorization: Bearer <token>
  - Body (JSON): { "sectionId": number, "prompt": string }
  - Response: { "text": string, "revisionId": number }

```bash
curl -X POST http://localhost:8000/api/projects/1/refine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sectionId":1,"prompt":"Make this more concise"}'
```

- POST /api/projects/{id}/feedback
  - Headers: Authorization: Bearer <token>
  - Body (JSON): { "sectionId": number, "like": boolean }
  - Response: { "ok": true }

```bash
curl -X POST http://localhost:8000/api/projects/1/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sectionId":1,"like":true}'
```

- POST /api/projects/{id}/comment
  - Headers: Authorization: Bearer <token>
  - Body (JSON): { "sectionId": number, "comment": string }
  - Response: created comment object

```bash
curl -X POST http://localhost:8000/api/projects/1/comment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sectionId":1,"comment":"Please cite sources"}'
```

Export

- POST /api/projects/{id}/export
  - Headers: Authorization: Bearer <token>
  - Body (JSON): { "format": "docx" | "pptx", "sections": [ids] (optional), "includeComments": boolean }
  - Response: downloadable file (mock). In curl use `-o filename` to save the response.

```bash
curl -X POST http://localhost:8000/api/projects/1/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"format":"docx","sections":[1],"includeComments":true}' -o project-1.docx
```

Testing notes

- Signup returns the created user object. Use `/api/auth/login` to receive a JWT token.
- For quick local testing you may generate a token programmatically using the same `JWT_SECRET` in `.env` (dev-only) — see `app/auth/jwt.py` for helpers.

If you want I can also generate a Postman collection JSON with all above requests prefilled for import.
# Backend (FastAPI)

This backend serves the React frontend in `../frontend`. It provides auth, project management, mock LLM endpoints and export functionality.

Quick start

1. Create a Python 3.10+ virtualenv and install:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and edit values if needed.

3. Start the app:

```bash
uvicorn app.main:app --reload --port 8000
```

4. Frontend .env example:

```env
# in frontend .env
VITE_API_BASE_URL=http://localhost:8000/api
```

Mock mode

Set `USE_MOCK=true` in `.env` to enable deterministic mock LLM outputs.

Docs

Open http://localhost:8000/docs for Swagger UI.

Migrations

Alembic is included as a dependency. For a simple dev flow we create tables automatically on startup. To use alembic, initialize and configure it to point to the database URL in `.env`.

Example curl commands

Sign up:

```bash
curl -X POST http://localhost:8000/api/auth/signup -H "Content-Type: application/json" -d '{"name":"Alice","email":"a@x.com","password":"pass"}'
```

Login:

```bash
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"email":"a@x.com","password":"pass"}'
```
