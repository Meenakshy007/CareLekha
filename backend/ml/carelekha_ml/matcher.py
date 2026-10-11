"""Safe candidate retrieval API for the medicine catalogue."""
from __future__ import annotations

from pathlib import Path
import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .text import normalize_text

PUBLIC_FIELDS = [
    "id", "name", "manufacturer_name", "price(₹)", "is_discontinued",
    "type", "pack_size_label", "short_composition1", "short_composition2"
]

class MedicineMatcher:
    def __init__(self, artifact_path: str | Path):
        # Only load trusted, locally generated artifacts. joblib/pickle can execute code.
        bundle = joblib.load(artifact_path)
        self.catalog = bundle["catalog"]
        self.vectorizer = bundle["vectorizer"]
        self.matrix = bundle["matrix"]
        self.artifact_version = bundle.get("artifact_version", 1)

    def match(self, ocr_text: str, top_k: int = 5) -> dict:
        query = normalize_text(ocr_text)
        if not query:
            return {
                "status": "needs_review",
                "message": "Enter the medicine text to search.",
                "candidates": [],
                "requires_human_confirmation": True
            }

        top_k = max(1, min(int(top_k), 10))
        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.matrix).ravel()

        if scores.size == 0 or float(np.max(scores)) <= 0:
            return {
                "status": "no_candidate",
                "message": "No plausible catalogue match. Ask a pharmacist to review it.",
                "candidates": [],
                "requires_human_confirmation": True
            }

        # Stable descending sort; do not interpret score as probability.
        ranked = np.argsort(-scores, kind="stable")[:top_k]
        candidates = []
        for idx in ranked:
            row = self.catalog.iloc[int(idx)]
            score = float(scores[int(idx)])
            if score <= 0:
                continue

            candidate = {}
            for field in PUBLIC_FIELDS:
                if field not in row.index:
                    continue
                value = row[field]
                if value is None:
                    value = None
                else:
                    try:
                        if value != value:
                            value = None
                    except Exception:
                        pass
                    if hasattr(value, "item"):
                        value = value.item()
                if field == "price(₹)" and value is not None:
                    value = float(value)
                candidate[field] = value

            candidate["similarity_score"] = round(score, 4)
            candidate["score_is_probability"] = False
            candidate["requires_human_confirmation"] = True
            candidates.append(candidate)

        return {
            "status": "candidates_found" if candidates else "no_candidate",
            "message": (
                "Candidates are ranked by text similarity only. Confirm the exact "
                "medicine, strength, and formulation against the original document."
                if candidates else
                "No plausible catalogue match. Ask a pharmacist to review it."
            ),
            "query": query,
            "candidates": candidates,
            "requires_human_confirmation": True
        }
