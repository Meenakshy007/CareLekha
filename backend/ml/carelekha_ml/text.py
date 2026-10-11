"""Text normalization helpers for medicine candidate retrieval."""
import re
import unicodedata

def normalize_text(value) -> str:
    if value is None:
        return ""
    # pandas NaN and other missing scalar values
    try:
        if value != value:
            return ""
    except Exception:
        pass
    text = unicodedata.normalize("NFKC", str(value)).casefold()
    text = text.replace("μ", "u").replace("µ", "u")
    text = re.sub(r"[\t\r\n]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
