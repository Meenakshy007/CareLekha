# CareLekha Medicine Matcher — complete baseline ML implementation

This package builds a local searchable medicine catalogue from `A_Z_medicines_dataset_of_India.csv`,
fits a character n-gram TF-IDF retrieval index, exposes a candidate-search API, and includes tests.

## Important safety boundary

This is a **candidate retrieval baseline**, not a clinically validated medicine-identification model.
The supplied catalogue has medicine/product names and metadata, but it does not contain labelled
prescription images or OCR-to-correct-name examples. Therefore, this implementation does not claim
to train a supervised clinical model.

- Never silently replace an OCR result with a candidate.
- A similarity score is not a probability of correctness.
- Confirm medicine name, strength, and formulation against the original prescription.
- Do not derive dosage, frequency, food advice, interactions, or suitability from this catalogue.
- The dataset's discontinued flag is metadata, not a definitive statement about current market status.
- Use only synthetic or properly de-identified prescription images during development.
- Have a qualified clinician/pharmacist review any clinical reference data and workflow before real use.

## 1. Setup

Place the CSV in the project root or pass its path explicitly:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

## 2. Build the catalogue and index

```bash
python -m carelekha_ml.train --csv A_Z_medicines_dataset_of_India.csv --out artifacts
```

This creates:
- `artifacts/medicine_catalog.csv`: cleaned and normalized catalogue
- `artifacts/medicine_matcher.joblib`: TF-IDF vectorizer + sparse matrix + catalogue rows
- `artifacts/metadata.json`: build statistics and model limitations

The script uses a **catalogue index**, not supervised training. Rebuild it when the catalogue changes.

## 3. Search from the command line

```bash
python -m carelekha_ml.cli --model artifacts/medicine_matcher.joblib --query "Augmentin 625 Duo"
```

Try likely OCR noise:
```bash
python -m carelekha_ml.cli --model artifacts/medicine_matcher.joblib --query "Azithrl 500"
```

Results are candidates for review only.

## 4. Start the API

```bash
uvicorn carelekha_ml.api:app --reload
```

Open `http://127.0.0.1:8000/docs`.

Endpoint:
`POST /match`

Example JSON:
```json
{
  "ocr_text": "Azithrl 500",
  "top_k": 5
}
```

The API returns candidate names, composition, strength-like catalogue text, discontinued metadata, and similarity scores. It does not return a verified/approved medicine result.

## 5. Run tests

```bash
pytest -q
```

The tests cover normalization, safe output semantics, empty input, and retrieval behavior using a small fixture. They do not prove clinical safety or real-world OCR accuracy.

## 6. Integration into the existing CareLekha app

Call the matcher after OCR extraction, and show the top candidates beside the original image/text. Require the caregiver to select/confirm the exact product and compare the strength/formulation. If candidates are ambiguous or no good candidate exists, ask a pharmacist/doctor rather than guessing.

Do not pass the top candidate directly into `build_schedule()`. Schedule generation must use the original prescription instructions after explicit confirmation, and must never infer missing times or doses.

## 7. What genuine supervised training requires

To train a classifier/ranker beyond this baseline, create a reviewed dataset containing:
- OCR text from real or representative prescription images
- verified correct medicine identity and strength
- plausible hard-negative candidate medicines
- document-level train/validation/test split
- reviewer and provenance metadata

Evaluate top-1 accuracy, top-5 recall, wrong high-confidence matches, and abstention rate. Synthetic typos alone are insufficient. Do not train a model to predict dosage or interaction warnings from this catalogue.
