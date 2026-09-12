import os

class Settings:
    PROJECT_NAME: str = "Life RPG - Level Up Your Life"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-life-rpg-jwt-key-change-in-prod-123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days session
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./life_rpg.db")

settings = Settings()
