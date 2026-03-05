# Payment confirmation via bank webhook (Casso/Sepay)

Acceptance Criteria: - System can receive webhook events with transaction amount and transfer content.
- If content matches an invoice code and amount is sufficient, system marks invoice as Paid automatically.
- If multiple invoices match or mismatch occurs, system flags for manual review.
Priority: Should
Related Epic: Payments
Requirement ID: REQ-019
Status: Draft
Type: Functional