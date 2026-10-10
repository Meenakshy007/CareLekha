import os
from dotenv import load_dotenv
from google import genai

print("STEP 1: Script started")

load_dotenv()
print("STEP 2: Environment loaded")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY was not found in .env")
    raise SystemExit(1)

print(f"STEP 3: API key found - starts with: {api_key[:8]}...")

try:
    client = genai.Client(api_key=api_key)
    print("STEP 4: Gemini client created")

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents="Reply with the single word SUCCESS."
    )

    print("STEP 5: Gemini responded")
    print("Response:", response.text)

except Exception as e:
    print("GEMINI ERROR:", type(e).__name__)
    print("DETAILS:", str(e))

