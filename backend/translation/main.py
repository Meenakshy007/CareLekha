
import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Load environment variables
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

# Use one model setting throughout the application.
# Change this to a model available to your Gemini API key.
MODEL_NAME = "gemini-3.5-flash"

client = genai.Client(api_key=API_KEY) if API_KEY else None

# -----------------------------
# FastAPI application
# -----------------------------
app = FastAPI(
    title="CareLekha Malayalam Translator",
    description="Translate medical text into Malayalam using Gemini.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# -----------------------------
# Request schema
# -----------------------------
class TranslationRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Medical text to translate into Malayalam",
    )


# -----------------------------
# Home endpoint
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "CareLekha Malayalam Translator is running",
        "model": MODEL_NAME,
    }


# -----------------------------
# Health endpoint
# -----------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "api_key_configured": bool(API_KEY),
        "model": MODEL_NAME,
    }


# -----------------------------
# Translation endpoint
# -----------------------------
@app.post("/translate-malayalam")
def translate_malayalam(request: TranslationRequest):

    if client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "GEMINI_API_KEY is missing. "
                "Check the project root .env file."
            ),
        )

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Please enter prescription text.",
        )

    prompt = f"""
Translate the following medical text into clear, natural Malayalam.

Rules:
- Preserve medicine names, numbers, strengths, units, doses,
  frequencies, dates, and durations exactly as written.
- Do not invent missing information.
- Do not add medical advice.
- Do not guess unclear instructions.
- If something is ambiguous, preserve the original wording.
- Return only the Malayalam translation.

Medical text:
{text}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        result = (response.text or "").strip()

        if not result:
            logger.error("Gemini returned an empty translation.")

            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty translation.",
            )

        return {
            "original_text": text,
            "translation": result,
            "model": MODEL_NAME,
        }

    except HTTPException:
        raise

    except Exception as exc:
        # Full diagnostic details appear in the terminal.
        logger.exception("Gemini API request failed")

        raise HTTPException(
            status_code=502,
            detail=(
                f"Gemini request failed: {type(exc).__name__}: "
                f"{str(exc)[:500]}"
            ),
        ) from exc
