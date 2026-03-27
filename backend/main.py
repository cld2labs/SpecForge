import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import config
from models.schemas import HealthResponse
from services import get_api_client

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app"""
    try:
        api_client = get_api_client()
        app.state.api_client = api_client
        logger.info("✓ SpecForge API starting...")
        logger.info(f"✓ Inference provider: {config.INFERENCE_PROVIDER}")
        logger.info(f"✓ Model: {config.INFERENCE_MODEL_NAME}")
        logger.info(f"✓ API client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize API client: {str(e)}")
        app.state.api_client = None

    yield

    logger.info("Shutting down SpecForge API")


app = FastAPI(
    title=config.APP_TITLE,
    description=config.APP_DESCRIPTION,
    version=config.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOW_ORIGINS,
    allow_credentials=config.CORS_ALLOW_CREDENTIALS,
    allow_methods=config.CORS_ALLOW_METHODS,
    allow_headers=config.CORS_ALLOW_HEADERS,
)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "SpecForge API is running",
        "version": config.APP_VERSION,
        "status": "healthy",
        "api_client_authenticated": app.state.api_client is not None
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Detailed health check"""
    return HealthResponse(
        status="healthy",
        model_configured=bool(config.INFERENCE_MODEL_NAME),
        inference_authenticated=app.state.api_client is not None and app.state.api_client.is_authenticated(),
        inference_provider=config.INFERENCE_PROVIDER
    )


from routers import questions, generate, refine, chat

app.include_router(questions.router)
app.include_router(generate.router)
app.include_router(refine.router)
app.include_router(chat.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
