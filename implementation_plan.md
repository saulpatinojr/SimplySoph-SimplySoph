# SimplySoph — Implementation Plan (Open Work)

Last updated: 2026-07-12

Completed in prior phase and tracked in CHANGELOG:
- Canonical Firestore rules rewrite
- Firestore emulator allow/deny test harness
- AI endpoint protection (ID token + admin claim + App Check + request guardrails)
- Admin route claim-aware guard rollout

This file now tracks remaining implementation work only.

## Phase 1 — Release Hardening (In Progress)

### 1. CI/CD Trust Restoration
- Ensure Firestore deploy executes predeploy checks end-to-end.

### 2. Deployment Workflow Consolidation
- Keep deployment permissions and secrets consistent across jobs.

### 3. Remaining Security Follow-ups
- Replace client-side newsletter unsubscribe update with signed server endpoint.
- Move abuse-prone public writes (contact/newsletter/comments/analytics) behind protected server handlers with anti-abuse controls.
- Remove remaining admin email fallback in storage rules/client user service after claims migration completion.

## Phase 2 — Routing and Product Correctness

### 1. Router Structure Hardening
- Simplify Switch/Suspense composition to avoid fragile route matching behavior.

## Phase 3 — Stability and Observability

### 1. Type and Domain Consistency
- Unify CreatorProfile shape across auth, UI, and Firestore mapping boundaries.
- Remove unsafe casts and add migration/defaulting behavior.

### 2. Runtime Observability
- Add production-safe client and functions error monitoring.
- Enforce redaction rules for logs and telemetry.

### 3. Test Expansion
- Add tests for auth redirects, admin claims, and AI endpoint failures.
- Add storage/firestore rules and CRUD behavior tests where missing.

## Phase 4 — Growth Features (After Foundations)

- Passport as differentiated travel hub.
- Media Kit partnership funnel.
- Affiliate product catalog + attribution.
- Newsletter segmentation and lifecycle automation.
- Cross-format content relationships.
