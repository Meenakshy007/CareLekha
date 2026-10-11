"""Build a medicine catalogue and character n-gram TF-IDF retrieval index.

This is index fitting, not supervised clinical model training. The CSV contains no
labelled OCR errors or verified prescription-image mappings.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from .text import normalize_text

REQUIRED_COLUMNS = [
    "id", "name", "price(₹)", "Is_discontinued", "manufacturer_name",
    "type", "pack_size_label", "short_composition1", "short_composition2"
]

def prepare_catalog(csv_path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")

    # Keep original columns, normalize fields used for search.
    for col in ["name", "manufacturer_name", "type", "pack_size_label",
                "short_composition1", "short_composition2"]:
        df[col] = df[col].fillna("").astype(str).str.strip()

    df["normalized_name"] = df["name"].map(normalize_text)
    df["normalized_composition1"] = df["short_composition1"].map(normalize_text)
    df["normalized_composition2"] = df["short_composition2"].map(normalize_text)
    df["is_discontinued"] = (
        df["Is_discontinued"].astype(str).str.strip().str.casefold()
        .isin({"true", "1", "yes", "y"})
    )

    df["search_text"] = (
        df["name"] + " " + df["short_composition1"] + " " +
        df["short_composition2"] + " " + df["pack_size_label"]
    ).map(normalize_text)

    # Do not merge products just because names overlap; deduplicate exact normalized
    # name + composition + pack to preserve potentially different formulations.
    df = df[df["normalized_name"].ne("")].drop_duplicates(
        subset=[
            "normalized_name", "normalized_composition1",
            "normalized_composition2", "pack_size_label"
        ]
    ).reset_index(drop=True)

    # Avoid NaN values in JSON/API responses.
    df["price(₹)"] = pd.to_numeric(df["price(₹)"], errors="coerce")
    df["id"] = pd.to_numeric(df["id"], errors="coerce").fillna(-1).astype(int)
    return df

def build_index(catalog: pd.DataFrame):
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        lowercase=False,   # text is already normalized
        min_df=1,
        sublinear_tf=True,
        dtype=np.float32
    )
    matrix = vectorizer.fit_transform(catalog["search_text"].tolist())
    return vectorizer, matrix

def train(csv_path: str | Path, out_dir: str | Path) -> dict:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    catalog = prepare_catalog(csv_path)
    vectorizer, matrix = build_index(catalog)

    catalog_path = out / "medicine_catalog.csv"
    catalog.to_csv(catalog_path, index=False)

    artifact = {
        "artifact_version": 1,
        "catalog": catalog,
        "vectorizer": vectorizer,
        "matrix": matrix,
        "model_type": "character n-gram TF-IDF candidate retrieval",
        "clinical_validation": False
    }
    model_path = out / "medicine_matcher.joblib"
    joblib.dump(artifact, model_path, compress=3)

    metadata = {
        "source_csv": Path(csv_path).name,
        "input_rows": int(pd.read_csv(csv_path, usecols=["id"]).shape[0]),
        "indexed_rows": int(len(catalog)),
        "feature_count": int(len(vectorizer.get_feature_names_out())),
        "matrix_shape": [int(matrix.shape[0]), int(matrix.shape[1])],
        "model_type": artifact["model_type"],
        "clinical_validation": False,
        "warning": (
            "Candidate retrieval only. Similarity scores are not probabilities, "
            "and matches require human confirmation."
        )
    }
    (out / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    return metadata

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to Indian medicine CSV")
    parser.add_argument("--out", default="artifacts", help="Output directory")
    args = parser.parse_args()
    print(json.dumps(train(args.csv, args.out), indent=2))

if __name__ == "__main__":
    main()
