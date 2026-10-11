
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from safety_engine import (
    verify_medicine,
    get_safety_alerts,
    build_schedule,
    get_all_medicines
)

# Load local WhatsApp Cloud API configuration from backend/safety/.env.
load_dotenv(Path(__file__).with_name(".env"))

from whatsapp_reminders import (
    disable_daily_reminders,
    save_daily_reminders,
    start_reminder_worker,
)

# 1. Define the app BEFORE using @app.get or @app.post
app = FastAPI(title="CareLekha Safety API")

# Allow the local CareLekha frontend to call the safety service directly.
# Keep this list explicit rather than allowing arbitrary website origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class MedicineRequest(BaseModel):
    name: str = Field(min_length=1)
    strength: str = Field(min_length=1)
    confirmed_by_user: bool = False


class ScheduleRequest(BaseModel):
    medicine_name: str
    strength: str
    dose: str
    confirmed_times: list[str]
    instructions_confirmed: bool
    confirmed_food_instruction: str | None = None


class ReminderMedicine(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=120)
    strength: str = Field(min_length=1, max_length=80)
    dose: str = Field(min_length=1, max_length=120)


class WhatsAppReminderSlot(BaseModel):
    slot: Literal["morning", "afternoon", "evening", "night"]
    send_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    medicines: list[ReminderMedicine] = Field(min_length=1, max_length=20)


class WhatsAppReminderRequest(BaseModel):
    recipient_phone: str = Field(min_length=8, max_length=20)
    timezone: str = Field(default="Asia/Kolkata", min_length=1, max_length=80)
    consent: bool = False
    reminders: list[WhatsAppReminderSlot] = Field(min_length=1, max_length=4)


class WhatsAppReminderDisableRequest(BaseModel):
    recipient_phone: str = Field(min_length=8, max_length=20)


# 2. Home endpoint
@app.get("/")
def home():
    return {
        "project": "CareLekha",
        "status": "running"
    }


# 3. Get all medicines
@app.get("/medicines")
def get_all():
    medicines = get_all_medicines()
    return {
        "count": len(medicines),
        "medicines": medicines
    }


# 4. Verify medicine
@app.post("/verify")
def verify(request: MedicineRequest):
    result = verify_medicine(
        name=request.name,
        strength=request.strength,
        confirmed_by_user=request.confirmed_by_user
    )

    medicine = result.get("medicine")
    if medicine:
        result["safety_alerts"] = get_safety_alerts(medicine)

    return result


# 5. Build schedule
@app.post("/schedule")
def schedule(request: ScheduleRequest):
    return build_schedule(request.model_dump())


@app.post("/reminders/whatsapp")
def schedule_whatsapp_reminders(request: WhatsAppReminderRequest):
    """Schedule opt-in daily WhatsApp reminders from the confirmed complete routine."""
    try:
        return save_daily_reminders(request.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/reminders/whatsapp/disable")
def stop_whatsapp_reminders(request: WhatsAppReminderDisableRequest):
    """Disable future daily reminders for the supplied recipient number."""
    try:
        return disable_daily_reminders(request.recipient_phone)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.on_event("startup")
def start_whatsapp_reminder_worker():
    start_reminder_worker()