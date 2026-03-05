# Manual correction before finalizing meter reading

Acceptance Criteria: - Owner can edit the OCR-extracted number before saving as final reading.
- System displays the photo next to the extracted value for review.
- Audit log records original OCR value, final value, and editor.
Priority: Must
Related Epic: OCR
Requirement ID: REQ-014
Status: Draft
Type: Functional

### 1) Decomposed structure (Epic → Feature → User Story → Acceptance Criteria)

**Epic:** OCR

**Feature OCR-04: Manual correction before finalizing**

**User Story OCR-04.1**

As an *Owner*, I want to edit the OCR-extracted reading while seeing the photo, so that I can correct OCR mistakes.

**Acceptance Criteria (OCR-04.1)**

- Given OCR produced a draft value, when I open the review screen, then the photo and extracted value are shown side-by-side.
- Given I edit the value, when I save, then the final value is stored and the system keeps the original OCR value for audit.
- Given the edited value is not numeric, when I save, then the system rejects with **400 INVALID_READING_FORMAT**.

---

### 2) Functional Requirements (FR)

#### FR-01 — Display OCR value with photo evidence

- **Requirement ID:** FR-01
- **Requirement Name:** OCR Review UI
- **Description:** Provide a UI for Owners to review OCR output with photo evidence.
- **Actor:** Owner
- **Input:** Reading id
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Load reading record and linked photo.
    3. Display photo and OCR value.
- **Output:** Review screen data
- **Exception Handling:**
    - Not found → `404 READING_NOT_FOUND`.
    - Forbidden → `403 FORBIDDEN`.

#### FR-02 — Save corrected reading and maintain audit fields

- **Requirement ID:** FR-02
- **Requirement Name:** Manual Correction Save
- **Description:** Allow Owner to replace OCR value with a corrected final value while preserving original OCR output.
- **Actor:** Owner
- **Input:** Reading id, corrected reading value
- **Processing:**
    1. Authenticate and authorize Owner.
    2. Validate corrected value matches `^[0-9]+$`.
    3. Store corrected value as final_value.
    4. Preserve original OCR output in ocr_raw_value.
    5. Record editor user id and timestamp.
    6. Set reading status to **Finalized** (if other validations passed or overridden).
- **Output:** Finalized reading
- **Exception Handling:**
    - Invalid format → `400 INVALID_READING_FORMAT`.
    - Wrong state → `409 INVALID_READING_STATE`.
    - Other failures → `500 INTERNAL_ERROR`.
- **Acceptance Criteria:**
    - Must satisfy OCR-04.1.

---

### 3) Non-Functional Requirements (NFR) — Quantifiable

- **NFR-01 Auditability:** 100% of manual corrections must record original OCR value, final value, editor id, and timestamp.
- **NFR-02 Performance:** Save correction p95 ≤ **2.0s** under **50 concurrent users**.

---

### 4) MVP scope

**Included in MVP**

- Manual correction UI
- Audit fields for original vs final value

**Future phases (not MVP)**

- Image annotation/cropping tool
- Suggested correction candidates

---

### 5) Supporting models (diagrams to include)

- **Sequence Diagram:** Owner reviews → edits → save → audit
- **ERD (if DB exists):** MeterReading (ocr_raw_value, final_value, edited_by, edited_at)