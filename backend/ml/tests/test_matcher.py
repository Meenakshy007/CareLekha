import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from carelekha_ml.matcher import MedicineMatcher
from carelekha_ml.train import build_index
from carelekha_ml.text import normalize_text

def fixture_catalog():
    return pd.DataFrame([
        {
            "id": 1, "name": "Metformin 500 mg Tablet",
            "manufacturer_name": "Example A", "price(₹)": 10.0,
            "is_discontinued": False, "type": "allopathy",
            "pack_size_label": "strip of 10 tablets",
            "short_composition1": "Metformin (500mg)",
            "short_composition2": "", "search_text":
            "metformin 500 mg tablet metformin (500mg) strip of 10 tablets"
        },
        {
            "id": 2, "name": "Amlodipine 5 mg Tablet",
            "manufacturer_name": "Example B", "price(₹)": 20.0,
            "is_discontinued": False, "type": "allopathy",
            "pack_size_label": "strip of 10 tablets",
            "short_composition1": "Amlodipine (5mg)",
            "short_composition2": "", "search_text":
            "amlodipine 5 mg tablet amlodipine (5mg) strip of 10 tablets"
        }
    ])

def make_matcher():
    catalog = fixture_catalog()
    vectorizer, matrix = build_index(catalog)
    return catalog, vectorizer, matrix

def test_normalization():
    assert normalize_text("  METFORMIN   500 MG ") == "metformin 500 mg"

def test_candidate_search_returns_confirmation_flag():
    catalog, vectorizer, matrix = make_matcher()
    # Build matcher without loading a serialized file.
    matcher = object.__new__(MedicineMatcher)
    matcher.catalog = catalog
    matcher.vectorizer = vectorizer
    matcher.matrix = matrix
    matcher.artifact_version = 1
    result = matcher.match("Metformin 500 mg", top_k=2)
    assert result["status"] == "candidates_found"
    assert result["requires_human_confirmation"] is True
    assert result["candidates"][0]["requires_human_confirmation"] is True
    assert result["candidates"][0]["score_is_probability"] is False

def test_empty_query_abstains():
    catalog, vectorizer, matrix = make_matcher()
    matcher = object.__new__(MedicineMatcher)
    matcher.catalog = catalog
    matcher.vectorizer = vectorizer
    matcher.matrix = matrix
    matcher.artifact_version = 1
    result = matcher.match("   ")
    assert result["status"] == "needs_review"
    assert result["candidates"] == []

def test_top_k_is_bounded():
    catalog, vectorizer, matrix = make_matcher()
    matcher = object.__new__(MedicineMatcher)
    matcher.catalog = catalog
    matcher.vectorizer = vectorizer
    matcher.matrix = matrix
    matcher.artifact_version = 1
    result = matcher.match("metformin", top_k=100)
    assert len(result["candidates"]) <= 10
