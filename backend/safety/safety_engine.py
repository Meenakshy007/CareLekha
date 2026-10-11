import json
import re
from pathlib import Path

DATA_FILE = Path(__file__).with_name("medicines.json")


def normalize_name(value: str) -> str:
    """Normalize spelling format only; do not guess drug identities."""
    return re.sub(r"\s+", " ", value.strip().casefold())


def load_database():
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def verify_medicine(
    name: str,
    strength: str,
    confirmed_by_user: bool = False
) -> dict:
    """
    Match an exact generic name + strength.
    Never use fuzzy matching to approve a medicine.
    """
    if not name.strip() or not strength.strip():
        return {
            "status": "needs_review",
            "verified": False,
            "message": "Medicine name or strength is missing."
        }

    db = load_database()
    matches = [
        item for item in db["records"]
        if normalize_name(item["generic_name"]) == normalize_name(name)
        and normalize_name(item["strength"]) == normalize_name(strength)
    ]

    if len(matches) != 1:
        return {
            "status": "needs_review",
            "verified": False,
            "message": "Exact medicine match not found. Ask a pharmacist to review it."
        }

    record = matches[0]

    if not confirmed_by_user:
        return {
            "status": "awaiting_confirmation",
            "verified": False,
            "medicine": record,
            "message": "Ask the user to confirm the medicine name and strength."
        }

    if record.get("review_status") != "clinically_reviewed":
        return {
            "status": "identity_match_unreviewed",
            "verified": False,
            "medicine": record,
            "message": "Identity record exists, but clinical review is incomplete."
        }

    return {
        "status": "verified",
        "verified": True,
        "medicine": record,
        "message": "Medicine identity matched a reviewed record."
    }
def get_all_medicines() -> list:
    db = load_database()
    return db["records"]

def get_safety_alerts(medicine: dict) -> list:
    """
    Return only alerts recorded with sources and clinical review.
    Missing data is an uncertainty, not evidence of safety.
    """
    alerts = []

    if medicine.get("review_status") != "clinically_reviewed":
        alerts.append({
            "level": "review_required",
            "message": "This medicine record has not been clinically reviewed.",
            "source_urls": medicine.get("source_urls", [])
        })

    if medicine.get("food_instruction") is None:
        alerts.append({
            "level": "unknown",
            "message": "Food instructions are unavailable. Confirm with a pharmacist.",
            "source_urls": []
        })

    if not medicine.get("food_interactions"):
        alerts.append({
            "level": "unknown",
            "message": (
                "No reviewed food-interaction data is available. "
                "This does not mean there are no interactions."
            ),
            "source_urls": []
        })

    for warning in medicine.get("warnings", []):
        if warning.get("reviewed") and warning.get("source_url"):
            alerts.append({
                "level": warning.get("level", "caution"),
                "message": warning["message"],
                "source_urls": [warning["source_url"]]
            })

    return alerts


def build_schedule(prescription: dict) -> dict:
    """
    Build a schedule only from explicit, confirmed instructions.
    Do not infer times from shorthand such as 1-0-1.
    """
    required = [
        "medicine_name",
        "strength",
        "dose",
        "confirmed_times",
        "instructions_confirmed"
    ]

    missing = [
        key for key in required
        if key not in prescription or prescription[key] in (None, "", [])
    ]

    if missing:
        return {
            "status": "needs_review",
            "schedule": [],
            "message": f"Missing or ambiguous fields: {', '.join(missing)}"
        }

    if prescription["instructions_confirmed"] is not True:
        return {
            "status": "needs_review",
            "schedule": [],
            "message": "Prescription instructions must be confirmed first."
        }

    # Times must be explicitly confirmed, not guessed from frequency.
    allowed_times = {"morning", "afternoon", "evening", "night"}
    times = prescription["confirmed_times"]

    if not isinstance(times, list) or not times:
        return {
            "status": "needs_review",
            "schedule": [],
            "message": "Explicit confirmed dose times are required."
        }

    if any(time not in allowed_times for time in times):
        return {
            "status": "needs_review",
            "schedule": [],
            "message": "A dose time is invalid or not supported."
        }

    return {
        "status": "ready_for_display",
        "schedule": [
            {
                "time": time,
                "medicine_name": prescription["medicine_name"],
                "strength": prescription["strength"],
                "dose": prescription["dose"],
                "instruction": prescription.get("confirmed_food_instruction")
            }
            for time in times
        ],
        "message": (
            "Schedule structured from confirmed inputs. "
            "This is not an independent medical approval."
        )
    }