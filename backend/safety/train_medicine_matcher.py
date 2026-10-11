import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer

CSV_PATH = "../../A_Z_medicines_dataset_of_India.csv"

df = pd.read_csv(CSV_PATH)

# Keep original catalogue names; normalize only for matching.
names = (
    df["name"]
    .dropna()
    .astype(str)
    .str.strip()
)

catalog = (
    pd.DataFrame({"medicine_name": names})
    .drop_duplicates(subset=["medicine_name"])
    .reset_index(drop=True)
)

# Character n-grams tolerate some spelling and OCR differences.
vectorizer = TfidfVectorizer(
    analyzer="char",
    ngram_range=(2, 5),
    lowercase=True,
    strip_accents="unicode",
    min_df=1
)

matrix = vectorizer.fit_transform(catalog["medicine_name"])

joblib.dump(
    {
        "catalog": catalog,
        "vectorizer": vectorizer,
        "matrix": matrix,
    },
    "medicine_matcher.joblib"
)

print("Catalogue entries:", len(catalog))
print("Saved medicine matcher.")
