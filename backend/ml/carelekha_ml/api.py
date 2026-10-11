"""FastAPI endpoint for medicine candidate retrieval."""
import os
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .matcher import MedicineMatcher

app = FastAPI(
    title="CareLekha Medicine Candidate API",
    description=(
        "Candidate retrieval only. Outputs are not clinical verification or medical advice."
    ),
    version="0.1.0"
)

class MatchRequest(BaseModel):
    ocr_text: str = Field(min_length=1, max_length=300)
    top_k: int = Field(default=5, ge=1, le=10)

@lru_cache(maxsize=1)
def get_matcher():
    path = os.getenv("CARELEKHA_MATCHER_PATH", "artifacts/medicine_matcher.joblib")
    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Matcher artifact not found at {path}. Run carelekha_ml.train first."
        )
    return MedicineMatcher(path)

@app.get("/health")
def health():
    return {"status": "ok", "service": "carelekha-medicine-candidate-api"}

@app.post("/match")
def match_medicine(request: MatchRequest):
    try:
        matcher = get_matcher()
        return matcher.match(request.ocr_text, request.top_k)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Medicine matcher is not built yet.") from exc
    except Exception as exc:
        # Avoid returning internal exception details.
        raise HTTPException(status_code=500, detail="Medicine candidate search failed.") from exc
