from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///../meva-app.db"
    debug: bool = False
    dev_mode: bool = True  # exposes /auth/dev-accounts for the mobile quick-login menu

    class Config:
        env_file = ".env"


settings = Settings()
