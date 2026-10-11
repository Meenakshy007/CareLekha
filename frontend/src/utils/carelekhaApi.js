const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function getApiBaseUrl() {
  return (import.meta.env.VITE_CARELEKHA_API_URL || DEFAULT_API_BASE_URL)
    .replace(/\/$/, "");
}

async function readResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return payload;
}

/**
 * Extract medicine fields from an image of a prescription.
 * The returned data is an OCR draft and must be reviewed by the caregiver
 * against the original prescription before any further use.
 */
export async function extractPrescription(file) {
  if (!(file instanceof File)) {
    throw new Error("Choose a prescription file first.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("For now, upload a JPG, PNG, or WebP image. PDF support is not enabled in the OCR API yet.");
  }

  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a non-empty image smaller than 10 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/extract-prescription`, {
    method: "POST",
    body: formData,
  });

  const result = await readResponse(response);
  return {
    ...result,
    needs_human_review: true,
  };
}

/** Exact identity lookup only. This endpoint does not approve treatment. */
export async function verifyMedicine({ name, strength, confirmedByUser = false }) {
  const response = await fetch(`${getApiBaseUrl()}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      strength,
      confirmed_by_user: confirmedByUser,
    }),
  });

  return readResponse(response);
}

/**
 * Create a display schedule only from explicit, confirmed instructions.
 * Never derive confirmedTimes from shorthand such as 1-0-1.
 */
export async function createConfirmedSchedule({
  medicineName,
  strength,
  dose,
  confirmedTimes,
  instructionsConfirmed,
  confirmedFoodInstruction = null,
}) {
  const response = await fetch(`${getApiBaseUrl()}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      medicine_name: medicineName,
      strength,
      dose,
      confirmed_times: confirmedTimes,
      instructions_confirmed: instructionsConfirmed,
      confirmed_food_instruction: confirmedFoodInstruction,
    }),
  });

  return readResponse(response);
}

export async function checkCareLekhaApi() {
  const response = await fetch(getApiBaseUrl(), { method: "GET" });
  return readResponse(response);
}
