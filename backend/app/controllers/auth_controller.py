from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.models import User
from app.utils.hash import hash_password, verify_password
from app.auth.jwt import create_access_token


async def signup_controller(session: AsyncSession, name: str, email: str, password: str):
    # check existing
    q = select(User).where(User.email == email)
    existing = (await session.execute(q)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        pw_hash = hash_password(password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = User(name=name, email=email, password_hash=pw_hash)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def login_controller(session: AsyncSession, email: str, password: str):
    q = select(User).where(User.email == email)
    user = (await session.execute(q)).scalars().first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"token": token, "user": user}
