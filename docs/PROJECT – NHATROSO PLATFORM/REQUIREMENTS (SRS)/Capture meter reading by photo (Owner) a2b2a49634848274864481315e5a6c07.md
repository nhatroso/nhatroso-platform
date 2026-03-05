# Capture meter reading by photo (Owner)

Acceptance Criteria: - Owner can open camera and attach a meter photo to a room for a billing period.
- System stores the original image as evidence and links it to the reading.
- Owner can view the stored photo later from invoice/reading details.
Priority: Must
Related Epic: OCR
Requirement ID: REQ-009
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** OCR

**Feature OCR-01: Capture meter photo and link to room + period**

**User Story OCR-01.1**

As an *Owner*, I want to take or upload a meter photo for a room and billing period, so that the system can extract readings with evidence.

**Acceptance Criteria (OCR-01.1)**

- Given I select a room and billing period, when I capture/upload a photo, then the system stores the original image and creates a draft reading record within **3 seconds**.
- Given the file is not an image or exceeds **10 MB**, when I upload, then the system rejects with **400 INVALID_FILE**.
- Given I upload a photo, when I open invoice/reading details later, then the same photo is displayed.

---

### 2) Functional Requirements (FR)

#### FR-01 — Upload and store meter photo

- **Requirement ID:** FR-01
- **Requirement Name:** Meter Photo Upload
- **Description:** Allow Owner to capture/upload a meter photo and store it as evidence linked to a room and billing period.
- **Actor:** Owner
- **Input:** Room id, meter type (electric/water), billing period (YYYY-MM), image file
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate room exists and belongs to Owner.
    3. Validate meter type in allowed set: `ELECTRIC`, `WATER`.
    4. Validate file type is image and size ≤ 10 MB.
    5. Store image in object storage and persist file reference.
    6. Create a meter reading record with status **Draft** and link the photo.
- **Output:** Reading draft created response (reading id, photo url reference)
- **Exception Handling:**
    - Unauthorized → `401 UNAUTHORIZED`.
    - Forbidden (not Owner) → `403 FORBIDDEN`.
    - Invalid file → `400 INVALID_FILE`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy OCR-01.1.

#### FR-02 — Retrieve stored photo

- **Requirement ID:** FR-02
- **Requirement Name:** Meter Photo Retrieval
- **Description:** Allow authorized users to view the stored photo from reading/invoice details.
- **Actor:** Owner (MVP), Tenant (read-only from their invoice)
- **Input:** Reading id or invoice id
- **Processing:**
    1. Authenticate.
    2. Authorize access: Owner can access for owned rooms; Tenant can access only for own invoices.
    3. Fetch photo reference and return signed URL.
- **Output:** Photo URL/stream
- **Exception Handling:**
    - Not found → `404 PHOTO_NOT_FOUND`.
    - Forbidden → `403 FORBIDDEN`.
    - Other failures → `500 INTERNAL_ERROR`.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Performance:** Photo upload + draft creation p95 ≤ **3.0s** under **10 concurrent uploads**.
- **NFR-02 Availability:** Photo storage access uptime ≥ **99.5%** monthly.
- **NFR-03 Security:** Photo URLs must be signed and expire in ≤ **15 minutes**.

---

### 4) MVP scope

**Included in MVP**

- Capture/upload meter photo
- Store original image and link to reading
- View photo from reading/invoice details

**Future phases (not MVP)**

- Batch capture for multiple rooms
- Image enhancement (crop/contrast) before OCR
- Offline capture and later sync

---

### 5) Supporting models (diagrams to include)

- **Use Case Diagram:** Owner uploads meter photo
- **Sequence Diagram:** Upload → store file → create reading draft
- **ERD (if DB exists):** Room, MeterReading, File