# Changelog

All notable changes to SimplySoph are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.1-beta] — 2026-07-12

### Added
- **Security tests** — Firestore emulator allow/deny suite at `tests/firestore.rules.test.mjs`
- **CI gate script** — `test:rules` script to run rules tests through Firebase emulators

### Changed
- **Firestore security model** — replaced duplicated/corrupted rules with a canonical single-block policy per collection
- **Admin access policy** — moved to claim-authoritative checks (`request.auth.token.role == "admin"`) in Firestore rules
- **Admin router guard** — all `/admin*` routes now require role-aware auth before rendering admin pages

### Security
- **AI endpoints** (`/api/ai/generate`, `/api/ai/persona-replies`) now enforce:
	- Firebase ID token verification
	- Admin-claim authorization
	- App Check verification outside emulator
	- Request-size limits
	- In-memory per-IP and per-user rate limits
- **AI request validation** — `action` is now allowlist-validated and provider payloads are schema-validated per action
- **Sensitive logging reduction** — removed raw provider error/body logging and switched Gemini key usage from URL query-string to header

### Infrastructure
- **Firestore deploy chain** — Firestore deploy now runs rules tests first via `firestore.predeploy`

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
