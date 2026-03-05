# Availability & resilience for core services

Acceptance Criteria: - Core services remain usable if OCR service is temporarily unavailable (graceful degradation).
- System surfaces clear status for OCR failures and allows manual entry.
- Service-to-service timeouts prevent cascading failures.
Priority: Should
Related Epic: Platform
Requirement ID: REQ-031
Status: Draft
Type: Non-functional