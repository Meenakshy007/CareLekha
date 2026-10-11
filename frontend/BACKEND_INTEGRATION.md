# Frontend ↔ Backend Integration

## Configure the backend URL

Copy `.env.example` to `.env` and set `VITE_CARELEKHA_API_URL` to the OCR API address. For local development, the default is `http://127.0.0.1:8000`.

Run the OCR API from the repository root with its own Python environment and dependencies installed. Keep `GEMINI_API_KEY` only in the backend environment; never put it in a Vite variable.

## Available frontend helpers

Import from `src/utils/carelekhaApi.js`:

- `extractPrescription(file)` — POSTs a JPG, PNG, or WebP image to `/extract-prescription`.
- `verifyMedicine({ name, strength, confirmedByUser })` — POSTs to `/verify`.
- `createConfirmedSchedule({...})` — POSTs explicit, confirmed schedule details to `/schedule`.
- `checkCareLekhaApi()` — GETs the OCR API root.

Example:

```jsx
import { extractPrescription } from "./utils/carelekhaApi";

const result = await extractPrescription(selectedFile);
setMedicines(result.medicines);
setNeedsReview(true);
```

Adjust the relative import path if the calling component is in a different folder.

## Important current limitations

- The OCR endpoint currently accepts JPG, PNG, and WebP images only. The frontend helper rejects PDFs instead of silently sending a file the API cannot process.
- Every OCR result is an unverified draft. Show the original image beside extracted fields and let a person compare and correct the medicine name, strength, dose, frequency, and duration before continuing.
- Missing or ambiguous fields must remain marked as review-required. Do not auto-fill timing from shorthand such as `1-0-1`.
- A `verified` medicine identity is not confirmation that a dose is appropriate for a particular patient. Demo medicine records are not clinically reviewed.
- The schedule endpoint only structures explicitly confirmed inputs; it is not medical approval.
- If browser requests are blocked, configure CORS on the FastAPI app for the frontend's local origin (typically `http://localhost:5173`). Do not use wildcard CORS with credentials in production.
- Do not upload identifiable patient documents to unapproved services.

These helpers are ready to be called from the existing UI, but the UI must explicitly invoke them in its upload/confirmation flow; adding the helper alone does not automatically connect buttons.
