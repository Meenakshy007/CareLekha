import Sanscript from "@indic-transliteration/sanscript";

/**
 * Convert Romanized Malayalam (Manglish) into Malayalam script.
 *
 * NOTE:
 * This uses a transliteration scheme, not a complete
 * conversational Manglish-to-Malayalam translation system.
 */
export function convertManglishToMalayalam(text) {
  if (!text || !text.trim()) {
    return "";
  }

  try {
    return Sanscript.t(text, "itrans", "mal");
  } catch (error) {
    console.error("Manglish conversion failed:", error);
    return text;
  }
}