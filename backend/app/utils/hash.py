from passlib.context import CryptContext

# Use Argon2 as the primary hashing algorithm (no 72-byte limit) with bcrypt as a fallback.
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password is required")
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    return pwd_context.verify(plain, hashed)
