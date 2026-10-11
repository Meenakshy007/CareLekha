"""Opt-in, persistent WhatsApp daily medicine reminders for CareLekha.

Requires the official WhatsApp Business Cloud API and an approved utility
message template. The local worker is designed for one Safety API process.
For multi-worker/production deployments, run the scheduler as a separate worker.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

DB_PATH = Path(__file__).with_name("whatsapp_reminders.sqlite3")
_ALLOWED_SLOTS = {"morning", "afternoon", "evening", "night"}
_SLOT_LABELS = {
    "morning": "രാവിലെ",
    "afternoon": "ഉച്ചയ്ക്ക്",
    "evening": "വൈകുന്നേരം",
    "night": "രാത്രി",
}
_THREAD: threading.Thread | None = None
_THREAD_LOCK = threading.Lock()


def whatsapp_is_configured() -> bool:
    """Return true only when all required Cloud API settings exist."""
    return all(
        os.getenv(name, "").strip()
        for name in (
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_PHONE_NUMBER_ID",
            "WHATSAPP_TEMPLATE_NAME",
        )
    )


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS whatsapp_daily_reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_phone TEXT NOT NULL,
                slot TEXT NOT NULL,
                send_time TEXT NOT NULL,
                timezone_name TEXT NOT NULL,
                medicines_json TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                next_run_utc TEXT NOT NULL,
                last_status TEXT NOT NULL DEFAULT 'scheduled',
                last_sent_utc TEXT,
                UNIQUE(recipient_phone, slot)
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_whatsapp_due_reminders
            ON whatsapp_daily_reminders(active, next_run_utc)
            """
        )


def _normalize_phone(raw_phone: str) -> str:
    compact = re.sub(r"[\s().-]", "", str(raw_phone or ""))
    if compact.startswith("00"):
        compact = "+" + compact[2:]
    if not compact.startswith("+"):
        compact = "+" + compact
    digits = compact[1:]
    if not re.fullmatch(r"[1-9]\d{7,14}", digits):
        raise ValueError(
            "ഫോൺ നമ്പർ രാജ്യകോഡോടെ നൽകുക. ഉദാഹരണം: +919876543210"
        )
    return "+" + digits


def _next_run_utc(send_time: str, timezone_name: str, now_utc: datetime | None = None) -> str:
    if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", send_time):
        raise ValueError("ഓർമ്മപ്പെടുത്തൽ സമയം ശരിയായ HH:MM രൂപത്തിൽ നൽകുക.")
    try:
        tz = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("സമയമേഖല ശരിയല്ല.") from exc

    now = (now_utc or datetime.now(timezone.utc)).astimezone(timezone.utc)
    local_now = now.astimezone(tz)
    hours, minutes = map(int, send_time.split(":"))
    target = local_now.replace(hour=hours, minute=minutes, second=0, microsecond=0)
    if target <= local_now:
        target += timedelta(days=1)
    return target.astimezone(timezone.utc).isoformat(timespec="seconds")


def save_daily_reminders(payload: dict[str, Any]) -> dict[str, Any]:
    """Persist daily slot reminders only after explicit recipient consent."""
    if not whatsapp_is_configured():
        raise RuntimeError(
            "WhatsApp Business API ക്രമീകരിച്ചിട്ടില്ല. Safety .env-ൽ access token, "
            "phone number ID, അംഗീകരിച്ച Malayalam template എന്നിവ ചേർക്കുക."
        )
    if payload.get("consent") is not True:
        raise ValueError("WhatsApp ഓർമ്മപ്പെടുത്തലുകൾക്ക് സ്വീകർത്താവിന്റെ അനുമതി ആവശ്യമാണ്.")

    phone = _normalize_phone(payload.get("recipient_phone", ""))
    timezone_name = str(payload.get("timezone") or "Asia/Kolkata")
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("സമയമേഖല ശരിയല്ല.") from exc

    reminders = payload.get("reminders")
    if not isinstance(reminders, list) or not reminders:
        raise ValueError("ഓർമ്മപ്പെടുത്താൻ കുറഞ്ഞത് ഒരു സമയമെങ്കിലും തയ്യാറാക്കണം.")
    seen_slots: set[str] = set()
    prepared: list[tuple[str, str, str, str]] = []

    for item in reminders:
        slot = str(item.get("slot") or "")
        if slot not in _ALLOWED_SLOTS:
            raise ValueError("ദൈനംദിന സമയവിഭാഗം ശരിയല്ല.")
        if slot in seen_slots:
            raise ValueError("ഒരു സമയവിഭാഗത്തിന് ഒരു ഓർമ്മപ്പെടുത്തൽ മാത്രം തിരഞ്ഞെടുക്കുക.")
        seen_slots.add(slot)

        send_time = str(item.get("send_time") or "")
        next_run = _next_run_utc(send_time, timezone_name)
        medicines = item.get("medicines")
        if not isinstance(medicines, list) or not medicines:
            raise ValueError(f"{_SLOT_LABELS[slot]} സമയത്തിന് മരുന്നുകളുടെ പട്ടികയില്ല.")

        safe_medicines: list[dict[str, str]] = []
        for medicine in medicines:
            name = str(medicine.get("medicine_name") or "").strip()
            strength = str(medicine.get("strength") or "").strip()
            dose = str(medicine.get("dose") or "").strip()
            if not name or not strength or not dose:
                raise ValueError("ഓരോ മരുന്നിനും പേര്, ശക്തി, ഡോസ് എന്നിവ ആവശ്യമാണ്.")
            safe_medicines.append({
                "medicine_name": name[:120],
                "strength": strength[:80],
                "dose": dose[:120],
            })

        prepared.append((
            slot,
            send_time,
            json.dumps(safe_medicines, ensure_ascii=False),
            next_run,
        ))

    _init_db()
    with _connect() as conn:
        conn.execute(
            "UPDATE whatsapp_daily_reminders SET active = 0 WHERE recipient_phone = ?",
            (phone,),
        )
        for slot, send_time, medicines_json, next_run in prepared:
            conn.execute(
                """
                INSERT INTO whatsapp_daily_reminders
                    (recipient_phone, slot, send_time, timezone_name,
                     medicines_json, active, next_run_utc, last_status, last_sent_utc)
                VALUES (?, ?, ?, ?, ?, 1, ?, 'scheduled', NULL)
                ON CONFLICT(recipient_phone, slot) DO UPDATE SET
                    send_time = excluded.send_time,
                    timezone_name = excluded.timezone_name,
                    medicines_json = excluded.medicines_json,
                    active = 1,
                    next_run_utc = excluded.next_run_utc,
                    last_status = 'scheduled',
                    last_sent_utc = NULL
                """,
                (phone, slot, send_time, timezone_name, medicines_json, next_run),
            )

    return {
        "status": "scheduled",
        "reminders_created": len(prepared),
        "local_times": [
            {
                "slot": slot,
                "label": _SLOT_LABELS[slot],
                "time": send_time,
            }
            for slot, send_time, _, _ in prepared
        ],
        "message": (
            "WhatsApp ഓർമ്മപ്പെടുത്തലുകൾ സജ്ജമാക്കി. സേവനം പ്രവർത്തിക്കാനും "
            "സന്ദേശ ടെംപ്ലേറ്റ് അംഗീകരിച്ചിരിക്കാനും വേണം."
        ),
    }


def disable_daily_reminders(raw_phone: str) -> dict[str, Any]:
    phone = _normalize_phone(raw_phone)
    _init_db()
    with _connect() as conn:
        result = conn.execute(
            "UPDATE whatsapp_daily_reminders SET active = 0 WHERE recipient_phone = ? AND active = 1",
            (phone,),
        )
        count = result.rowcount
    return {
        "status": "disabled",
        "reminders_disabled": count,
        "message": "ഈ നമ്പറിലേക്കുള്ള WhatsApp ഓർമ്മപ്പെടുത്തലുകൾ നിർത്തി.",
    }


def _claim_due_reminders() -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    now_text = now.isoformat(timespec="seconds")
    _init_db()
    due: list[dict[str, Any]] = []

    with _connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        rows = conn.execute(
            """
            SELECT * FROM whatsapp_daily_reminders
            WHERE active = 1 AND next_run_utc <= ?
            ORDER BY next_run_utc
            LIMIT 50
            """,
            (now_text,),
        ).fetchall()

        for row in rows:
            # Advance the occurrence inside the transaction before sending. This
            # avoids duplicate sends if two local processes briefly overlap.
            next_run = _next_run_utc(row["send_time"], row["timezone_name"], now)
            conn.execute(
                """
                UPDATE whatsapp_daily_reminders
                SET next_run_utc = ?, last_status = 'sending'
                WHERE id = ? AND active = 1 AND next_run_utc <= ?
                """,
                (next_run, row["id"], now_text),
            )
            if conn.total_changes:
                due.append(dict(row))
        conn.commit()
    return due


def _send_template_message(reminder: dict[str, Any]) -> None:
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "").strip()
    language = os.getenv("WHATSAPP_TEMPLATE_LANGUAGE", "ml").strip() or "ml"
    graph_version = os.getenv("WHATSAPP_GRAPH_API_VERSION", "v23.0").strip() or "v23.0"
    if not token or not phone_number_id or not template_name:
        raise RuntimeError("WhatsApp Cloud API credentials are missing.")

    slot = reminder["slot"]
    medicines = json.loads(reminder["medicines_json"])
    medicine_lines = [
        f'{item["medicine_name"]} ({item["strength"]}) — {item["dose"]}'
        for item in medicines
    ]
    medicine_text = "\n".join(medicine_lines)[:900]
    payload = {
        "messaging_product": "whatsapp",
        "to": reminder["recipient_phone"].lstrip("+"),
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": _SLOT_LABELS.get(slot, slot)},
                        {"type": "text", "text": medicine_text},
                    ],
                }
            ],
        },
    }

    url = f"https://graph.facebook.com/{graph_version}/{phone_number_id}/messages"
    with httpx.Client(timeout=20.0) as client:
        response = client.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()


def _mark_delivery(reminder_id: int, status: str) -> None:
    with _connect() as conn:
        if status == "sent":
            conn.execute(
                """
                UPDATE whatsapp_daily_reminders
                SET last_status = ?, last_sent_utc = ?
                WHERE id = ?
                """,
                (status, datetime.now(timezone.utc).isoformat(timespec="seconds"), reminder_id),
            )
        else:
            conn.execute(
                "UPDATE whatsapp_daily_reminders SET last_status = ? WHERE id = ?",
                (status, reminder_id),
            )


def _worker_loop() -> None:
    while True:
        try:
            if whatsapp_is_configured():
                for reminder in _claim_due_reminders():
                    try:
                        _send_template_message(reminder)
                        _mark_delivery(int(reminder["id"]), "sent")
                    except Exception as exc:  # don't log message text, phone or token
                        print(f"CareLekha WhatsApp reminder failed: {type(exc).__name__}")
                        _mark_delivery(int(reminder["id"]), "failed")
        except Exception as exc:
            print(f"CareLekha reminder worker error: {type(exc).__name__}")
        time.sleep(15)


def start_reminder_worker() -> None:
    """Start a single daemon worker when the Safety API starts."""
    global _THREAD
    with _THREAD_LOCK:
        if _THREAD is not None and _THREAD.is_alive():
            return
        _THREAD = threading.Thread(
            target=_worker_loop,
            name="carelekha-whatsapp-reminders",
            daemon=True,
        )
        _THREAD.start()
