import argparse
import json
from .matcher import MedicineMatcher

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="artifacts/medicine_matcher.joblib")
    parser.add_argument("--query", required=True)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()
    matcher = MedicineMatcher(args.model)
    print(json.dumps(matcher.match(args.query, args.top_k), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
