import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db.database import connect_db, close_db
from app.middleware.logging_middleware import LoggingMiddleware
from ai_model.predictor import load_models
from app.routers import (
    auth, questionnaire, screening, mood_log,
    patients, clinical_notes, alerts, feedback, reports, admin, connections, doctors,
)

# Configure logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("app")
logging.getLogger("pymongo").setLevel(logging.DEBUG)
logging.getLogger("motor").setLevel(logging.DEBUG)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Lifespan: Starting up...")
    try:
        await connect_db()
        logger.info("Lifespan: DB connected.")
        load_models(settings.stage1_model_path, settings.stage2_model_path)
        logger.info("Lifespan: Models loaded.")
    except Exception as e:
        logger.error(f"Lifespan startup FAILED: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("Lifespan: Shutting down...")
    await close_db()
    logger.info("Lifespan: Shutdown complete.")


app = FastAPI(
    title="BipolarGuide API",
    version="1.0.0",
    description="AI-Assisted Bipolar Disorder Screening & Mental Health Monitoring Platform",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

PREFIX = "/api/v1"
app.include_router(auth.router,           prefix=PREFIX)
app.include_router(connections.router,    prefix=PREFIX)
app.include_router(questionnaire.router,  prefix=PREFIX)
app.include_router(screening.router,      prefix=PREFIX)
app.include_router(mood_log.router,       prefix=PREFIX)
app.include_router(patients.router,       prefix=PREFIX)
app.include_router(clinical_notes.router, prefix=PREFIX)
app.include_router(alerts.router,         prefix=PREFIX)
app.include_router(feedback.router,       prefix=PREFIX)
app.include_router(reports.router,        prefix=PREFIX)
app.include_router(admin.router,          prefix=PREFIX)
app.include_router(doctors.router,        prefix=PREFIX)


@app.get("/api/v1/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "BipolarGuide API", "version": "1.0.0"}
