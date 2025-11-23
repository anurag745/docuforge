import os
import pytest
import asyncio
from httpx import AsyncClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_app.db")
os.environ.setdefault("USE_MOCK", "true")


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
async def test_app():
    # import app and run startup
    from app.main import app
    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        yield ac
