import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)
app = FastAPI(title="CareLekha AI API")

MODEL = "gemini-3.5-flash"


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
        chat = client.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PrescriptionResult
            )
        )

        response = chat.send_message([
            prompt,
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=file.content_type
            )
        ])

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response."
            )

        result = PrescriptionResult.model_validate_json(
            response.text
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        import traceback

        print("\n========== CARELEKHA ERROR ==========")
        traceback.print_exc()
        print("Error type:", type(e).__name__)
        print("Error message:", str(e))
        print("=====================================\n")

        raise HTTPException(
            status_code=502,
            detail=f"Prescription processing failed: {type(e).__name__}: {str(e)[:200]}"
        ) from e


