# OCR recognition outputs numeric reading

Acceptance Criteria: - OCR service returns a numeric string reading and a confidence score.
- System rejects non-numeric outputs and requests re-capture or manual entry.
- Reading is stored with timestamp, room, meter type (electric/water), and photo evidence.
Priority: Must
Related Epic: OCR
Requirement ID: REQ-012
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** OCR

**Feature OCR-02: OCR recognition returns numeric reading + confidence**

**User Story OCR-02.1**

As the system, I want to run OCR on a meter photo and return a numeric reading with a confidence score, so that billing can be generated.

**Acceptance Criteria (OCR-02.1)**

- Given an OCR job completes successfully, when results are returned, then `reading_value` is a numeric string (digits only) and `confidence` is between **0.00** and **1.00**.
- Given OCR output contains non-numeric characters, when validation runs, then the system sets status to **Needs Review** and returns **422 OCR_NON_NUMERIC_OUTPUT**.
- Given OCR service is unavailable, when a job is submitted, then the system returns **503 OCR_SERVICE_UNAVAILABLE** and keeps the reading in **Failed** status.

---

### 2) Functional Requirements (FR)

#### FR-01 — Submit OCR job

- **Requirement ID:** FR-01
- **Requirement Name:** OCR Job Submission
- **Description:** Submit a meter photo to OCR service and track processing state.
- **Actor:** System
- **Input:** Reading id, photo reference
- **Processing:**
    1. Validate reading exists and has photo.
    2. Create OCR job record with status **Queued**.
    3. Send request to OCR service with photo URL.
    4. Update job status to **Processing**.
- **Output:** OCR job accepted
- **Exception Handling:**
    - Missing photo → `409 MISSING_PHOTO_EVIDENCE`.
    - OCR service unavailable → `503 OCR_SERVICE_UNAVAILABLE`.
    - Other failures → `500 INTERNAL_ERROR`.

#### FR-02 — Receive OCR result and validate numeric

- **Requirement ID:** FR-02
- **Requirement Name:** OCR Result Validation
- **Description:** Validate OCR output is numeric and store confidence score.
- **Actor:** System
- **Input:** OCR response: extracted text, confidence
- **Processing:**
    1. Extract candidate reading text.
    2. Normalize by trimming whitespace.
    3. Validate matches regex `^[0-9]+$`.
    4. If valid, store reading_value and confidence; set reading status to **Recognized**.
    5. If invalid, store raw OCR output and set reading status to **Needs Review**.
- **Output:** Updated reading record
- **Exception Handling:**
    - Invalid confidence range → clamp to [0,1] and log warning.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy OCR-02.1.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** OCR processing time p95 ≤ **10 seconds** per image under **5 concurrent OCR jobs**.
- **NFR-02 Reliability:** OCR success rate (job returns a response) ≥ **95%** excluding invalid images.
- **NFR-03 Observability:** Store OCR raw output and confidence for **100%** of jobs.

---

### 4) MVP scope

**Included in MVP**

- OCR returns numeric reading + confidence
- Reject non-numeric outputs and require manual review

**Future phases (not MVP)**

- Multi-field extraction (meter id, date)
- Model fine-tuning per meter type

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Reading created → OCR job → result callback → validation
- **ERD (if DB exists):** MeterReading, OcrJob