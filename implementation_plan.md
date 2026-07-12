# SimplySoph — Implementation Plan (Open Work)

Last updated: 2026-07-12

Completed in prior phase and tracked in CHANGELOG:
- Canonical Firestore rules rewrite
- Firestore emulator allow/deny test harness
- AI endpoint protection (ID token + admin claim + App Check + request guardrails)
- Admin route claim-aware guard rollout

This file now tracks remaining implementation work only.

## Phase 1 — Release Hardening (Closed)

Completed and verified in repository:
- CI deploy gates now include rules tests, typecheck, route-link crawl, functions build, and app build.
- Deployment workflow consolidated to the active production path and existing lighthouse workflow.
- Firebase deploy auth migrated off `FIREBASE_TOKEN` to service-account credentials.
- Signed newsletter unsubscribe endpoint and controlled server-side public-write handlers were implemented.

Open hardening items moved to backlog tracking in `todo.md`:
- Remaining admin email fallback removal after claims migration completion.
- Public-write operational hardening completion (duplicate suppression/spam quarantine/alerts).
- Analytics ingestion strategy finalization.

## Phase 2 — Routing and Product Correctness

Status: **Approved / Active**

### 1. Router Structure Hardening
- [x] Simplify Switch/Suspense composition to avoid fragile route matching behavior.
- [x] Add route regression tests for public/admin paths.
- [x] Expand route regression coverage to guest, normal user, stale admin token, and admin-path behaviors.
- [x] Ensure specific admin routes are declared before the generic `/admin` route and guard with a specificity regression test.

## Phase 3 — Stability and Observability

Status: **Approved / Active**

### 1. Type and Domain Consistency
- [x] Unify CreatorProfile shape across auth, UI, and Firestore mapping boundaries.
- [x] Remove unsafe casts and add migration/defaulting behavior in the user profile read/write path.
- [ ] Complete migration/defaulting verification across existing legacy user documents in production data.

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
