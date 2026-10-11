# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Connect to the CareLekha backend

1. Copy `.env.example` to `.env` in the `frontend/` directory.
2. Keep `VITE_CARELEKHA_API_URL=http://127.0.0.1:8000` for local development. Do not add a trailing slash.
3. Start the OCR API and its ML and safety dependencies in separate terminals, using the backend's local setup instructions.
4. Run `npm install` and `npm run dev` from `frontend/`.
5. Open the local Vite URL and upload a JPG, PNG, or WebP prescription image, then select **Analyze Prescription**.

The prescription upload flow in `src/HomePage.jsx` calls `POST /extract-and-review` and displays OCR fields, candidate matches, and identity-review messages. The browser sends the image as multipart form data; do not set the multipart `Content-Type` header manually.

The OCR API currently accepts JPG, PNG, and WebP images, not PDFs. All extracted fields and catalogue candidates require review against the original prescription. Candidate similarity scores are not probabilities, and a matching medicine identity is not approval of a patient-specific dose or schedule.

For a different local backend address, change `VITE_CARELEKHA_API_URL` in `.env` and restart Vite. The OCR backend must allow the frontend's origin in its CORS configuration.


## Daily Routine step

After analysis, open **4. സമയക്രമം (Daily Routine)** in the workflow. For each extracted medicine:

1. Compare the medicine identity and strength with the original prescription and tick the review checkbox above.
2. Enter the dose as explicitly confirmed from the written instructions; this field is intentionally not auto-filled.
3. Select only the time labels explicitly confirmed by the doctor or pharmacist. The app must not infer morning/afternoon/evening/night from shorthand such as `1-0-1` or frequency text.
4. Confirm the entered details and select **Build daily routine**.

The frontend posts the explicitly confirmed fields to `POST /schedule` on the OCR API. The OCR API forwards the request to the safety service. Keep the safety API on its configured local port (default `8002`) and OCR API on `8000`.

The generated list is a display aid for the provided inputs, not a prescription, medical recommendation, verified reminder, or clinical approval. It does not send notifications, decide medication timing, or determine whether a dose is appropriate for a patient. The current time choices are broad labels supported by the existing safety API—not clock-time scheduling.
