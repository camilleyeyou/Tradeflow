---
status: partial
phase: 04-operations
source: [04-VERIFICATION.md]
started: 2026-03-26T00:00:00Z
updated: 2026-03-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Admin onboarding flow end-to-end
expected: Admin fills /admin/clients/new form, submits, is redirected to /admin/clients/[id], sees client info card with GHL link or "Not provisioned" warning. Auth user setup callout banner is visible.
result: [pending]

### 2. Non-admin redirect enforced
expected: Opening /admin/clients in incognito (or with a non-ADMIN_EMAIL account) redirects to /login
result: [pending]

### 3. Stripe webhook signature rejection
expected: POST /api/webhooks/stripe without a valid stripe-signature header returns 400
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
