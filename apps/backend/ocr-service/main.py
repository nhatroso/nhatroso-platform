from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="OCR Service")

class OCRRequest(BaseModel):
    image_url: str

class OCRResponse(BaseModel):
    value: str
    confidence: float

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ocr-service"}

@app.post("/api/ocr", response_model=OCRResponse)
def perform_ocr(payload: OCRRequest):
    # TODO: Implement real OCR logic
    return {
        "value": "123456",
        "confidence": 0.98
    }
