from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import UserCreate, TokenResponse, UserOut, LoginRequest
from app.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.auth_controller import signup_controller, login_controller
from app.auth.jwt import decode_access_token
from fastapi import Header

router = APIRouter()


async def get_db():
    async with get_session() as session:
        yield session


@router.post("/signup", response_model=UserOut)
async def signup(payload: UserCreate, session: AsyncSession = Depends(get_db)):
    user = await signup_controller(session, payload.name, payload.email, payload.password)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db)):
    res = await login_controller(session, payload.email, payload.password)
    return {"token": res["token"], "user": res["user"]}


def get_current_user(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"id": int(user.get("sub")), "email": user.get("email")}
