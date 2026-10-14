import sys
from pathlib import Path

# Set UTF-8 encoding for console printing
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_endpoints():
    print("--- 1. Testing Root & Health ---")
    res = client.get("/")
    assert res.status_code == 200, f"Root returned {res.status_code}"
    if "application/json" in res.headers.get("content-type", ""):
        print("Root response (JSON):", res.json())
    else:
        print(f"Root response (Frontend HTML): {len(res.content)} bytes rendered")

    res = client.get("/api/health")
    assert res.status_code == 200, f"Health returned {res.status_code}"
    print("Health response:", res.json())

    print("\n--- 2. Testing Schemes Endpoint ---")
    res = client.get("/api/schemes")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 4
    print(f"Loaded {len(schemes)} schemes successfully. First: {schemes[0]['name']}")

    print("\n--- 3. Testing Mandi Rates & Weather Feasibility ---")
    res = client.get("/api/mandi-rates")
    assert res.status_code == 200
    mandi_data = res.json()
    assert "market_prices" in mandi_data
    assert "weather_feasibility" in mandi_data
    print(f"Loaded {len(mandi_data['market_prices'])} Mandi markets.")
    print("Weather feasibility:", mandi_data["weather_feasibility"]["feasibility_badge"])

    print("\n--- 4. Testing Dosage Calculation ---")
    res = client.post("/api/dosage-calculate", json={
        "crop_name": "Paddy",
        "acres": 4.0
    })
    assert res.status_code == 200
    dosage_res = res.json()
    print("Calculated dosage for 4 acres Paddy:", dosage_res["dosage"])
    assert dosage_res["dosage"]["urea_kg"] == 200
    assert dosage_res["dosage"]["dap_kg"] == 100

    print("\n--- 5. Testing Voice/Text AI Pipeline (Process Text) ---")
    voice_query = "నా పేరు కార్తీక్ తల్లూరి. నా వద్ద 4 ఎకరాల భూమి ఉంది. వరి పంటకు ఎంత యూరియా వేయాలి? మరియు PM-KISAN దరఖాస్తు చేయాలి."
    res = client.post("/api/process-text", json={"text": voice_query})
    assert res.status_code == 200
    processed = res.json()
    print("Intent extracted:", processed["ai_result"]["intent"])
    print("Action required:", processed["ai_result"]["action_required"])
    print("Telugu response:", processed["ai_result"]["user_response_te"][:60], "...")
    assert processed["pdf_data"] is not None, "PDF should have been generated for FORM_FILLING intent"
    doc_id = processed["pdf_data"]["doc_id"]
    print("Generated PDF doc_id:", doc_id)

    print("\n--- 6. Testing Direct PDF Generation & Download ---")
    res = client.post("/api/generate-pdf", json={
        "farmer_name": "కార్తీక్ తల్లూరి",
        "phone": "9876543210",
        "aadhaar": "XXXX-XXXX-1234",
        "scheme_name": "PM-KISAN",
        "crop_name": "Paddy (వరి)",
        "land_acres": 4.0
    })
    assert res.status_code == 200
    pdf_info = res.json()
    pdf_doc_id = pdf_info["doc_id"]
    print("Direct generated PDF ID:", pdf_doc_id)

    download_res = client.get(f"/api/download-pdf/{pdf_doc_id}")
    assert download_res.status_code == 200
    assert download_res.headers.get("content-type") == "application/pdf"
    assert len(download_res.content) > 1000
    print(f"Downloaded PDF verified! Size: {len(download_res.content)} bytes")

    print("\n--- 7. Testing Voice File Upload Processing ---")
    # Simulate wav audio upload
    fake_wav_bytes = b"RIFF....WAVEfmt ...." + b"\x00" * 200
    res = client.post(
        "/api/process-voice",
        files={"file": ("farmer_audio.wav", fake_wav_bytes, "audio/wav")},
        data={"transcript_text": "వరి పంట 3 ఎకరాలకు ఎరువుల మోతాదు ఎంత?"}
    )
    assert res.status_code == 200
    voice_file_res = res.json()
    print("Voice upload processed. Intent:", voice_file_res["ai_result"]["intent"])
    print("Spoken Telugu answer:", voice_file_res["ai_result"]["user_response_te"][:60], "...")

    print("\n==========================================")
    print("ALL BACKEND ENDPOINTS & PIPELINES VERIFIED!")
    print("==========================================")

if __name__ == "__main__":
    test_endpoints()
