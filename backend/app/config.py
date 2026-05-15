import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/bipolarguide")
    jwt_secret: str = os.getenv("JWT_SECRET", "bipolarguide-dev-secret-key")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    google_maps_api_key: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    stage1_model_path: str = os.getenv("STAGE1_MODEL_PATH", "./models/stage1_MLP.pkl")
    stage2_model_path: str = os.getenv("STAGE2_MODEL_PATH", "./models/stage2_RF.pkl")
    allowed_origins: list = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost,http://localhost:4200"
    ).split(",")


settings = Settings()
