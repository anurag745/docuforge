import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database import init_db

from app.routers import auth as auth_router
from app.routers import projects as projects_router

# Support a comma-separated list of frontend origins via FRONTEND_URLS for local dev
_frontend_env = os.getenv("FRONTEND_URLS") or os.getenv("FRONTEND_URL") or "http://localhost:8080"
if isinstance(_frontend_env, str):
    # split on comma and strip whitespace
    ALLOWED_ORIGINS = [o.strip() for o in _frontend_env.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = ["http://localhost:3000"]

app = FastAPI(title="Document AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log some startup info for easier debugging
import logging
from app.services.llm_service import llm_service
logger = logging.getLogger(__name__)
logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")
logger.info(f"LLM provider: {llm_service.provider}; USE_MOCK={os.getenv('USE_MOCK', 'true')}")


@app.on_event("startup")
async def on_startup():
    await init_db()


# include routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects_router.router, prefix="/api/projects", tags=["projects"])
