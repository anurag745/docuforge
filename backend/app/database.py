import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Convert sqlite:/// to sqlite+aiosqlite:///
if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite+aiosqlite://"):
    DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

# async_sessionmaker was added in newer SQLAlchemy; provide a fallback for older versions
try:
    from sqlalchemy.ext.asyncio import async_sessionmaker  # type: ignore
    engine = create_async_engine(DATABASE_URL, future=True, echo=False)
    AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)
except Exception:
    # Fallback: use classical sessionmaker but instruct it to create AsyncSession instances
    from sqlalchemy.orm import sessionmaker as sync_sessionmaker
    engine = create_async_engine(DATABASE_URL, future=True, echo=False)
    AsyncSessionLocal = sync_sessionmaker(class_=AsyncSession, bind=engine, expire_on_commit=False)
Base = declarative_base()


async def init_db():
    # import models here to ensure they are registered on Base
    import app.models.models as models

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # small sanity check
    async with AsyncSessionLocal() as session:
        pass


def get_session() -> AsyncSession:
    return AsyncSessionLocal()
