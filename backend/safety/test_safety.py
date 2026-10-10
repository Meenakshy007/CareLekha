
from safety_engine import verify_medicine, build_schedule


def test_unknown_medicine_is_not_verified():
    result = verify_medicine(
        name="unknown demo medicine",
        strength="999 mg",
        confirmed_by_user=True,
    )

    assert result["verified"] is False
    assert result["status"] == "needs_review"


def test_medicine_requires_caregiver_confirmation():
    result = verify_medicine(
        name="metformin",
        strength="500 mg",
        confirmed_by_user=False,
    )

    assert result["verified"] is False
    assert result["status"] == "awaiting_confirmation"


def test_demo_medicine_is_not_clinically_verified():
    result = verify_medicine(
        name="amlodipine",
        strength="5 mg",
        confirmed_by_user=True,
    )

    assert result["verified"] is False
    assert result["status"] == "identity_match_unreviewed"


def test_schedule_rejects_missing_prescription_details():
    result = build_schedule({
        "medicine_name": "DEMO MEDICINE",
        "strength": "Example strength",
        "dose": "",
        "confirmed_times": [],
        "instructions_confirmed": False,
    })

    assert result["status"] == "needs_review"
    assert result["schedule"] == []


def test_schedule_accepts_explicit_confirmed_times():
    result = build_schedule({
        "medicine_name": "DEMO MEDICINE",
        "strength": "Example strength",
        "dose": "Example dose",
        "confirmed_times": ["morning", "night"],
        "instructions_confirmed": True,
        "confirmed_food_instruction": None,
    })

    assert result["status"] == "ready_for_display"
    assert len(result["schedule"]) == 2
    assert result["schedule"][0]["time"] == "morning"
    assert result["schedule"][1]["time"] == "night"


def test_schedule_rejects_unsupported_time_labels():
    result = build_schedule({
        "medicine_name": "DEMO MEDICINE",
        "strength": "Example strength",
        "dose": "Example dose",
        "confirmed_times": ["twice daily"],
        "instructions_confirmed": True,
        "confirmed_food_instruction": None,
    })

    assert result["status"] == "needs_review"
    assert result["schedule"] == []

