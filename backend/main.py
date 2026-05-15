# Re-export the FastAPI app so `uvicorn main:app` works from the backend directory
from app.main import app  # noqa: F401
