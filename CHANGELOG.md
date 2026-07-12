# Changelog

All notable changes to SimplySoph are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.1-beta] — 2026-07-12

### Added
- **Security tests** — Firestore emulator allow/deny suite at `tests/firestore.rules.test.mjs`
- **CI gate script** — `test:rules` script to run rules tests through Firebase emulators
- **Route crawl test** — `client/src/routing/internal-links.test.ts` to assert internal links resolve to declared app routes
- **Render-level route regression tests** — `client/src/routing/route-regression.test.tsx` covering public, dynamic, admin-guarded, and 404 route behavior
- **Admin route specificity regression** — test coverage ensures `/admin/blog/new` resolves to the edit route and does not fall through to generic admin/blog pages
- **CreatorProfile lifecycle tests** — `client/src/lib/services/user.test.ts` now covers missing profile, first login profile creation, returning login updates, admin promotion, and admin demotion flows
- **useAuth hook edge-case tests** — `client/src/_core/hooks/useAuth.test.ts` now covers redirect-on-unauthenticated behavior and refresh fallbacks/errors
- **Monitoring redaction tests** — `client/src/lib/monitoring.test.ts` verifies PII/token redaction in telemetry payload sanitization
- **Functions telemetry utility** — `functions/src/telemetry.ts` adds structured logging with server-side redaction for sensitive fields and token/email patterns
- **Functions AI failure-path tests** — `functions/src/ai.test.ts` covers invalid actions, missing Gemini config, invalid provider payloads, provider failures, and persona-reply parse fallback behavior
- **AI API auth/quota tests** — `tests/ai-api-auth.test.ts` covers ID token enforcement, admin-claim checks, App Check requirements, emulator bypass, and per-IP/per-user AI rate limits at the `/api` boundary
- **Storage rules tests** — `tests/storage.rules.test.mjs` covers public reads, admin media uploads, avatar ownership, and denied fallback paths in Cloud Storage rules

### Changed
- **Firestore security model** — replaced duplicated/corrupted rules with a canonical single-block policy per collection
- **Admin access policy** — moved to claim-authoritative checks (`request.auth.token.role == "admin"`) in Firestore rules
- **Admin router guard** — all `/admin*` routes now require role-aware auth before rendering admin pages
- **Router matching hardening** — switched to per-route lazy wrappers and ordered specific admin routes before the generic `/admin` route
- **CreatorProfile normalization** — user profile reads/writes now normalize `uid/email/displayName/photoURL/role/preferences` and strip undefined writes to keep profile shape consistent across auth and Firestore
- **Client runtime observability** — added global error/unhandled-rejection monitoring and wired app/route error boundaries into redacted telemetry capture
- **Functions runtime observability** — API and AI handlers now emit structured redacted telemetry with centralized unhandled-exception capture in `/api`
- **Functions test harness** — `functions/package.json` now includes a package-level `test` script for built Function tests
- **Vitest discovery** — `vitest.config.ts` now includes shared root `tests/` suites so Functions API coverage can run without entering the Functions TypeScript build
- **Auth/UI guard regression coverage** — route suite now includes explicit admin-claim promotion and demotion transition assertions
- **AI generate missing-config path** — fixed `handleAiGenerate()` to resolve the action before logging/config branching, preventing a runtime reference error on unconfigured environments
- **Verification pipeline** — root verification scripts now include combined Firestore+Storage rules checks and the shared Vitest suite, and Storage deploys run their own predeploy test gate
- **Public-write API coverage** — the root API suite now covers newsletter subscribe/unsubscribe failure paths, contact submissions, public-write App Check enforcement, and authenticated comment creation
- **Public route integrity** — added missing routes for `/passport`, `/passport/:slug`, `/media-kit`, `/privacy-policy`, and `/terms-of-service`
- **Admin destination routing** — added `/admin/destinations`, `/admin/destinations/new`, and `/admin/destinations/:id` routes so dashboard destination links resolve
- **Path mismatch fix** — corrected admin photo list CTA from `/admin/photos/new` to `/admin/photo/new`
- **Path mismatch fix** — corrected video editor back-link from `/admin/videos` to `/admin/video`
- **Footer legal links** — wired Privacy and Terms links to their dedicated legal pages
- **Auth redirect consistency** — unauthenticated redirect logic now keys off Firebase auth state, preventing false redirects when profile enrichment temporarily fails

### Security
- **AI endpoints** (`/api/ai/generate`, `/api/ai/persona-replies`) now enforce:
	- Firebase ID token verification
	- Admin-claim authorization
	- App Check verification outside emulator
	- Request-size limits
	- In-memory per-IP and per-user rate limits
- **AI request validation** — `action` is now allowlist-validated and provider payloads are schema-validated per action
- **Sensitive logging reduction** — removed raw provider error/body logging and switched Gemini key usage from URL query-string to header
- **Signed newsletter unsubscribe** — added expiring HMAC-signed unsubscribe tokens and a dedicated `/api/newsletter/unsubscribe` endpoint (GET for email-link flow, POST for API clients)
- **Controlled public-write handlers** — added `/api/newsletter/subscribe`, `/api/contact/submit`, and `/api/comments/create` server endpoints with validation allowlists, input length limits, and per-IP rate limiting
- **Client write-path hardening** — migrated newsletter, contact form, and comment creation flows from direct client Firestore writes to server-side API handlers

### Infrastructure
- **Firestore deploy chain** — Firestore deploy now runs rules tests first via `firestore.predeploy`
- **CI route guard** — added explicit `test:links` gate in deployment workflow before build/deploy
- **Policy deploy scope** — production policy deploy now includes `firestore:rules`, `firestore:indexes`, and `storage`
- **Tokenless Firebase deploy auth** — replaced deprecated `FIREBASE_TOKEN` workflow usage with `FIREBASE_SERVICE_ACCOUNT` credentials

### Process
- **Phase gate update** — Phase 1 security follow-ups are closed and work is approved to move into Phase 2 (routing and product correctness), with remaining hardening backlog tracked in `todo.md`
- **Phase gate update** — Phase 3 stability/observability is now closed; the repository is ready to move into Phase 4 growth work

---

## [0.2.0-beta] — 2026-06-14

### Added
- **Blog** — editorial magazine grid (featured hero card + sidebar + 3-column grid)
- **Blog** — sticky frosted category filter bar with pill buttons
- **BlogPost** — reading-time estimate in article header
- **BlogPost** — like button with optimistic UI and pop keyframe animation
- **BlogPost** — compact `ShareButtons` in header + full share bar at article bottom
- **ShareButtons** — Web Share API with clipboard fallback and ✓ copied animation
- **SearchBar** — 300 ms debounce, error state, `aria-combobox` semantics
- **Navigation** — frosted glass effect on scroll
- **PhotoEdit** — dynamic categories select (replaces hard-coded items)
- **NewsletterModal** — `useNewsletterModal()` convenience hook exported
- **vite.config.ts** — `@emailjs/browser` marked external (optional runtime dep)
- **CI** — automated Lighthouse performance audit workflow (`lighthouse.yml`)
- **CI** — `lighthouserc.cjs` with 3-run audits and score thresholds
- **package.json** — `lighthouse`, `lighthouse:collect`, `lighthouse:assert`, `lighthouse:upload` npm scripts

### Fixed
- **PhotoEdit.tsx** — `SelectTrigger` missing close tag (line 619)
- **PhotoEdit.tsx** — duplicate `SelectContent` block removed
- **PhotoEdit.tsx** — extra `</div>` causing JSX mismatch; `space-y-6` wrapper restored
- **Navigation.tsx** — `SearchBar` named import (`export function`, not `export default`)
- **index.css** — `btn-gold` `@apply` custom class invalid in Tailwind v4; replaced with inline utilities
- **search.ts** — full rewrite to remove binary-corrupted regex characters
- **blog.ts** — `togglePostLike()` Firestore increment export added
- **Comments.tsx** — `CreatorProfile` props (`uid`, `displayName`, `photoURL`) corrected
- **CategoryEdit.tsx** — `description` type mismatch (`null` → `undefined`)
- **ContentCalendar.tsx** — `Day` component props typed as `any` (react-day-picker v9 compat)

### Security
- `npm audit fix` — 32 packages updated
- Install scripts approved: `esbuild`, `fsevents`, `protobufjs`, `@firebase/util`

### CSS
- `.share-btn`, `.share-pill`, `.share-pill--accent`
- `.like-btn`, `.like-btn.liked`, `@keyframes like-pop`
- `.post-meta`, `.badge-category`, `.reveal-up` utilities

---

## [0.1.0-beta] — 2026-06 (initial beta)

### Added
- Initial project scaffold — Vite + React 19 + TypeScript + Tailwind v4
- Firebase Auth, Firestore, Storage integration
- Admin dashboard — Photo albums, Blog, Videos, Categories, Destinations
- Public pages — Home, Blog, Photos, Travel (Passport), Contact, About
- `DashboardLayout` with sidebar navigation
- `ContentCalendar` with react-day-picker v9
- `RichTextEditor` (Tiptap v3) for blog posts
- `TikTokCommentFeed` and `YouTubeLiveChat` widgets
- `PhotoCarousel` component
- Firebase Hosting deploy workflow with preview channels
- Firestore security rules
- Algolia search integration

---
