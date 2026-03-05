# Asynchronous OCR processing via queue

Acceptance Criteria: - When an image is uploaded, OCR request can be queued and processed asynchronously.
- Client receives processing status (Queued/Processing/Completed/Failed).
- System retries failed OCR jobs with a capped retry policy.
Priority: Should
Related Epic: OCR
Requirement ID: REQ-029
Status: Draft
Type: Functional