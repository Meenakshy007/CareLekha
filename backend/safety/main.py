
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from safety_engine import (
    verify_medicine,
    get_safety_alerts,
    build_schedule,
    get_all_medicines
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