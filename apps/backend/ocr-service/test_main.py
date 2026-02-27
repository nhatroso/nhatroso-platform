from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ocr-service"}

def test_perform_ocr():
    response = client.post("/api/ocr", json={"image_url": "http://example.com/test.jpg"})
    assert response.status_code == 200
    data = response.json()
    assert "value" in data
    assert "confidence" in data
