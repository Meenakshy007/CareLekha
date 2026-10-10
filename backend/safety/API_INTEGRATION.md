# CareLekha — Backend API Integration Guide

## Base URL

Local development: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

## 1. Health / Home

**Endpoint:** `GET /`

Example response:

```json
{
  "project": "CareLekha",
  "status": "running"
}
```

## 2. List Medicine Records

**Endpoint:** `GET /medicines`

Returns the medicine records currently available in the demo database.

**Important:** Demo records are not clinically reviewed. Do not present them as verified medicines.

## 3. Verify Medicine Identity

**Endpoint:** `POST /verify`

Request:

```json
{
  "name": "metformin",
  "strength": "500 mg",
  "confirmed_by_user": false
}
```

Possible outcomes include:

- `awaiting_confirmation` — user confirmation is required.
- `needs_review` — no exact match or required information is missing.
- `identity_match_unreviewed` — a matching record exists, but clinical review is incomplete.
- `verified` — the identity matches a record marked as clinically reviewed; this is not proof that the medicine or dose is appropriate for a specific patient.

The frontend must handle each status explicitly.

## 4. Build a Schedule

**Endpoint:** `POST /schedule`

Request fields:

- `medicine_name`
- `strength`
- `dose`
- `confirmed_times`
- `instructions_confirmed`
- `confirmed_food_instruction` (optional)

The current implementation accepts explicit time labels from its supported set: `morning`, `afternoon`, `evening`, and `night`.

Possible outcomes include:

- `needs_review` — information is missing, unconfirmed, or unsupported.
- `ready_for_display` — a schedule structure was created from the supplied inputs. This is not independent medical approval.

Never infer medication times from shorthand such as `1-0-1`.

## Frontend integration notes

- Send JSON with `Content-Type: application/json`.
- Show uncertainty and review-required states clearly.
- Never invent missing dose or timing information.
- Do not treat caregiver confirmation as clinical verification.
- Use synthetic data for development and testing.
- Do not send identifiable patient information to unapproved services.