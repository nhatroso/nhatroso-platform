# OCR preprocessing pipeline (crop/deskew/denoise)

Acceptance Criteria: - System performs automatic preprocessing on uploaded meter photos (at least grayscale + denoise + deskew).
- Preprocessed image improves text visibility and is used for recognition.
- If preprocessing fails, system falls back to original image and flags the attempt.
Priority: Should
Related Epic: OCR
Requirement ID: REQ-010
Status: Draft
Type: Functional