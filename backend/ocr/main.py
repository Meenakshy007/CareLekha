import os
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)
app = FastAPI(title="CareLekha AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_API_URL = os.getenv("CARELEKHA_ML_API_URL", "http://127.0.0.1:8001")
SAFETY_API_URL = os.getenv("CARELEKHA_SAFETY_API_URL", "http://127.0.0.1:8003")

# Try the current stable Flash model first, then automatically fall back if it is overloaded.
MODEL_FALLBACKS = (
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
)


class Medicine(BaseModel):
    medicine_name: Optional[str] = None
    strength: Optional[str] = None
    prescribed_dose: Optional[str] = None
    original_dosage_notation: Optional[str] = None
    frequency: Optional[str] = None
    food_instruction: Optional[str] = None
    duration: Optional[str] = None
    uncertainty: str = "Review required"


class PrescriptionResult(BaseModel):
    medicines: list[Medicine]
    needs_human_review: bool = True

def flag_missing_identity_fields(medicine: Medicine) -> Medicine:
    """Flag incomplete identities for human review, not validate OCR correctness."""
    if not medicine.medicine_name or not medicine.strength:
        medicine.uncertainty = "Review required"
    return medicine


@app.get("/")
def home():
    return {
        "message": "CareLekha AI API is running",
        "status": "ok"
    }


@app.post("/extract-prescription", response_model=PrescriptionResult)
async def extract_prescription(file: UploadFile = File(...)):
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WebP image."
        )

    image_bytes = await file.read()

    if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is empty or exceeds the 10 MB limit."
        )

    prompt = """
    Extract medicine information from this prescription image.

    Return only information supported by the image.

    Rules:
    - Never guess an unclear medicine name, strength, or dosage.
    - Use null for missing or unreadable fields.
    - Preserve the original dosage notation exactly when legible.
    - Do not infer medicine timing from dosage notation alone.
    - Do not invent food instructions or treatment duration.
    - Record uncertainty for ambiguous information.
    - Include every medicine you can identify.
    - Set needs_human_review to true.
    - Do not diagnose, prescribe, or modify instructions.
    """

    try:
        result = None
        model_failures = []

        # Fail over immediately between supported models; don't make the caregiver
        # manually change model IDs when one model is temporarily overloaded.
        for model_name in MODEL_FALLBACKS:
            try:
                chat = client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=PrescriptionResult,
                    ),
                )

                response = chat.send_message([
                    prompt,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=file.content_type,
                    ),
                ])

                if not response.text:
                    raise ValueError("The model returned an empty response.")

                result = PrescriptionResult.model_validate_json(response.text)
                print(f"CareLekha OCR succeeded with {model_name}.")
                break

            except Exception as model_error:
                model_failures.append((model_name, model_error))
                # Avoid logging raw provider responses or secrets.
                print(
                    f"CareLekha OCR model {model_name} failed: "
                    f"{type(model_error).__name__}"
                )

        if result is None:
            error_text = " ".join(str(err).lower() for _, err in model_failures)
            overloaded = any(
                marker in error_text
                for marker in ("503", "unavailable", "high demand", "overload", "deadline")
            )

            if overloaded:
                raise HTTPException(
                    status_code=503,
                    detail="ഇപ്പോൾ AI സേവനത്തിൽ തിരക്ക് കൂടുതലാണ്. മറ്റൊരു മോഡലും ശ്രമിച്ചു, പക്ഷേ ലഭ്യമായില്ല. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.",
                )

            raise HTTPException(
                status_code=502,
                detail="കുറിപ്പടി വായിക്കാനായില്ല. ചിത്രം വ്യക്തമായതാണെന്ന് ഉറപ്പാക്കി വീണ്ടും ശ്രമിക്കുക.",
            )
        for medicine in result.medicines:
            flag_missing_identity_fields(medicine)
        return result

    except HTTPException:
        raise

    except Exception as e:
        # Keep provider internals and raw exception text out of the caregiver-facing UI.
        print(f"CareLekha prescription processing failed: {type(e).__name__}")
        raise HTTPException(
            status_code=502,
            detail="കുറിപ്പടി പ്രോസസ്സ് ചെയ്യാനായില്ല. ചിത്രം പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
        ) from e




@app.post("/extract-and-review")
async def extract_and_review(file: UploadFile = File(...)):
    """Run OCR, retrieve medicine candidates and query the safety identity API."""
    ocr_result = await extract_prescription(file)
    reviewed = []

    async with httpx.AsyncClient(timeout=20.0) as http:
        for medicine in ocr_result.medicines:
            item = medicine.model_dump()
            name, strength = item.get("medicine_name"), item.get("strength")
            candidates = {
                "status": "not_attempted",
                "candidates": [],
                "requires_human_confirmation": True,
            }

            if name:
                query = " ".join(part for part in (name, strength) if part)
                try:
                    res = await http.post(f"{ML_API_URL}/match", json={"ocr_text": query, "top_k": 5})
                    res.raise_for_status()
                    candidates = res.json()
                except (httpx.HTTPError, ValueError):
                    candidates = {"status": "matcher_unavailable", "candidates": [], "requires_human_confirmation": True}

            if not name or not strength:
                identity = {
                    "status": "needs_review",
                    "verified": False,
                    "message": "Medicine name or strength is missing. Review the original prescription with a qualified professional.",
                }
            else:
                try:
                    res = await http.post(
                        f"{SAFETY_API_URL}/verify",
                        json={"name": name, "strength": strength, "confirmed_by_user": False},
                    )
                    res.raise_for_status()
                    identity = res.json()
                except (httpx.HTTPError, ValueError):
                    identity = {
                        "status": "safety_service_unavailable",
                        "verified": False,
                        "message": "Safety service unavailable. This medicine has not been verified.",
                    }

            reviewed.append({
                "extracted_medicine": item,
                "ml_candidates": candidates,
                "identity_check": identity,
                "requires_human_review": True,
            })

    return {
        "medicines": reviewed,
        "needs_human_review": True,
        "message": "ML matches are suggestions only. Review all extracted details against the original prescription; do not infer missing doses or timings.",
    }


