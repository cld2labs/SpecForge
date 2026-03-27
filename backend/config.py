"""
Configuration settings for SpecForge API
"""

import os
from dotenv import load_dotenv

load_dotenv()

INFERENCE_PROVIDER = os.getenv("INFERENCE_PROVIDER", "remote")

INFERENCE_API_ENDPOINT = os.getenv(
    "INFERENCE_API_ENDPOINT",
    "http://host.docker.internal:11434" if os.getenv("INFERENCE_PROVIDER", "remote") == "ollama" else None
)
INFERENCE_API_TOKEN = os.getenv("INFERENCE_API_TOKEN")
INFERENCE_MODEL_NAME = os.getenv(
    "INFERENCE_MODEL_NAME",
    "codellama:34b" if os.getenv("INFERENCE_PROVIDER", "remote") == "ollama" else "gpt-4o"
)

APP_TITLE = "SpecForge API"
APP_DESCRIPTION = "AI-powered system design specification generator"
APP_VERSION = "2.0.0"

LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "8000"))

VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"

CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]
