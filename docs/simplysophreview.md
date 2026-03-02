# SimplySoph — Full Production Audit & Implementation Plan
**Date:** March 2, 2026 | **Branch:** `docs/code-review-report` | **Scope:** Full codebase, all features, production readiness

---

## IMPLEMENTATION OBJECTIVES

1. Fix every P0/P1 broken item before any feature work
2. Complete all "planned but not implemented" features
3. Harden security (Firestore rules, Storage rules, admin claims)
4. Wire all real integrations (AI, newsletter, Instagram, email)
5. Ship what a next-generation content creator platform should ship

---

## SECTION 1 — CRITICAL: THINGS THAT ARE CURRENTLY BROKEN

### 1.1 Production Build Is Broken

**Severity: 🔴 P0 — Build cannot complete**
**File:** `client/src/lib/services/user.ts` · **Evidence:** `build_error.txt`

Syntax error at line 45 halts TypeScript compilation entirely. `npm run build` fails. No production artifact is being generated.

---

### 1.2 Contact Form Submissions Always Fail with `permission-denied`

**Severity: 🔴 P0 — Feature completely broken**
**Files:** `client/src/lib/services/contact.ts` · `firestore.rules`

`contact.ts` writes to `contact_messages`; Firestore rules cover `contactSubmissions`. The catch-all `allow read, write: if false` blocks ALL writes. Every submission silently fails.

**Fix:** Rename the rule block to `contact_messages` OR rename the collection in code. Add proper validation.

---

### 1.3 Email Queuing Permanently Blocked by Firestore Rules

**Severity: 🔴 P0 — Feature completely broken**
**Files:** `client/src/lib/services/email.ts` · `firestore.rules`

`email.ts` writes to the `mail` collection (Firebase Trigger Email Extension pattern). There is no rule for `mail`. Catch-all deny blocks the write. Even if the extension were installed, no document can reach it.

**Fix:** Add `match /mail/{docId}` rule allowing authenticated writes (or server-only via Admin SDK).

---

### 1.4 Newsletter Subscriptions Rejected Due to Field Name Mismatch

**Severity: 🔴 P0 — Feature completely broken**
**Files:** `client/src/lib/newsletter.ts` · `firestore.rules`

Service writes `subscribedAt`; Firestore rule validates `createdAt`. `hasRequiredFields` fails. Every signup attempt rejected with `permission-denied`. UI appears to succeed — no data is ever stored.

**Fix:** Update rule to check for `subscribedAt`, OR update service to write `createdAt`.

---

### 1.5 `setAdminClaim` Cloud Function Is Not Deployed

**Severity: 🔴 P0 — Admin management non-functional**
**Files:** `functions/src/setAdminClaim.ts` · `functions/src/index.ts`

`setAdminClaim.ts` defines the callable function but is **never imported or exported from `functions/src/index.ts`**. Firebase deploys only what is exported from `index.ts`. There is no operational path to programmatically grant the admin claim to any user. Bootstrap gap: the function requires caller to already hold the admin claim — first admin cannot be set through this function.

**Fix:** Export `setAdminClaim` from `index.ts`. Add a seeded bootstrap path (environment-variable-triggered one-time run or Firebase Console Admin SDK script).

---

### 1.6 Fourteen TypeScript Compiler Errors Prevent Type-Safe Builds

**Severity: 🔴 P0 — TypeScript compilation fails**
**Evidence:** `errors.txt`

| File | Lines | Error |
|---|---|---|
| `client/src/components/Comments.tsx` | 59 | `Property 'name' does not exist on type 'CreatorProfile'` (should be `displayName`) |
| `client/src/components/Comments.tsx` | 60 | `Property 'avatarUrl' does not exist on type 'CreatorProfile'` (should be `photoURL`) |
| `client/src/components/Comments.tsx` | 148 | `Property 'id' does not exist on type 'CreatorProfile'` (should be `uid`) |
| `client/src/components/DashboardLayout.tsx` | 245, 250 | `Property 'name' does not exist on type 'CreatorProfile'` |
| `client/src/lib/services/blog.ts` | 77 | `generateSearchTokens` called with HTML string where `tags: string[]` expected |
| `client/src/lib/services/blog.ts` | 84–92 | `string \| null` not assignable to `string \| undefined` |
| `client/src/lib/services/blog.ts` | 87, 113 | `Property 'tags' does not exist on type 'BlogPostInput'` |
| `client/src/pages/admin/BlogEdit.tsx` | 329 | `Property 'tags' does not exist on type 'BlogPostInput'` |
| `client/src/pages/admin/CategoryEdit.tsx` | 142 | `string \| null` not assignable to `string \| undefined` (`color: null`) |
| `client/src/pages/admin/ContentCalendar.tsx` | 461 | `Property 'htmlAttributes' does not exist` |

---

## SECTION 2 — AUTHENTICATION DEEP DIVE

### 2.1 `isAuthenticated` Is Derived from Firestore Profile, Not Firebase Auth State

**Severity: 🔴 Critical**
**File:** `client/src/_core/hooks/useAuth.ts`

```typescript
const isAuthenticated = Boolean(profile);  // ← WRONG
```

`profile` is a Firestore read. If it fails (network, rules error, cold start, first login), `isAuthenticated` is `false` even though Firebase confirms the user is signed in. A Firebase-authenticated user can be treated as anonymous if their Firestore profile momentarily fails to load.

**Fix:** `const isAuthenticated = Boolean(firebaseUser);`

---

### 2.2 Admin Role Derives from Firestore `users` Document — Self-Promotable

**Severity: 🔴 Critical (Security)**
**Files:** `client/src/_core/hooks/useAuth.ts` · `firestore.rules` · `client/src/lib/services/user.ts`

Firestore rules allow any authenticated user to write to their own `/users/{uid}` document with no field-level restriction. Any authenticated user can write `{ role: "admin" }` to their own document and `useAuth.ts` will reflect it as `user.role === "admin"`. This is a **privilege escalation vulnerability**.

**Fix:** Disallow `role` field writes in Firestore rules:
```javascript
allow write: if request.auth.uid == userId
  && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
```
Role must be set exclusively via Cloud Functions Admin SDK.

---

### 2.3 `checkAdminClaim` Uses Cached Token — New Claims Not Reflected for Up to 1 Hour

**Severity: 🟡 Medium**
**File:** `client/src/lib/services/user.ts`

`getIdTokenResult(false)` returns cached JWT. One-character fix: change to `getIdTokenResult(true)` to force refresh after claim mutation. Add forced token refresh in the admin claim grant workflow.

---

### 2.4 Auth Redirect Uses `window.location.assign` Instead of wouter Router

**Severity: 🟢 Low**
**Fix:** Replace with wouter's `setLocation()` to preserve React Query cache and component state.

---

### 2.5 Double Auth Check on Every Admin Page (Maintenance Trap)

**Severity: 🟢 Low**
`App.tsx` wraps admin routes in `<AdminRoute>/<RequireAuth>` AND each page has its own local check. Centralize in `RequireAuth` only; remove per-page redundant checks.

---

### 2.6 Profile Fetched 3x on Every Auth State Change (Performance)

**Severity: 🟢 Low**
`upsertCreatorProfile()` reads Firestore, then `fetchCreatorProfile()` reads it again. Return the profile from `upsertCreatorProfile` and eliminate the redundant second read.

---

## SECTION 3 — ADMIN PORTAL DEEP DIVE

### 3.1 PhotoEdit: Navigate-Away Before Photo Saves Complete (Data Loss)

**Severity: 🔴 Critical**
**File:** `client/src/pages/admin/PhotoEdit.tsx`

`onSuccess` fires `setLocation("/admin/photo")` which unmounts the component mid-`for...of` loop. Individual photo saves and deletes execute as orphaned async operations with no error reporting. No transaction, no batch write, no rollback.

**Fix:** Await all photo operations before navigating; use Firestore `writeBatch()` for atomic photo document operations.

---

### 3.2 Admin List Pages Have No "Create" Button in Header

**Severity: 🟡 Medium**
**Files:** `BlogList.tsx` · `PhotoList.tsx`

Both files contain `{/* Header */}` empty comment blocks — no page title, no description, no "New Post"/"New Album" CTA. The only path to create new content is the empty-state card, which only appears when zero records exist.

**Fix:** Add proper header with "New Post" / "New Album" button sections.

---

### 3.3 VideoEdit Thumbnail Stored Under `blog/` Storage Path

**Severity: 🟡 Medium**
**File:** `client/src/pages/admin/VideoEdit.tsx`

`const storageRef = ref(storage, \`blog/${baseFileName}\`)` — video thumbnails stored under `blog/` prefix, not `videos/`. Mixes content types, confuses storage auditing, may conflict with path-based Storage rules.

**Fix:** Use `\`thumbnails/${baseFileName}\`` or `\`videos/thumbnails/${baseFileName}\``.

---

### 3.4 DestinationEdit Has No DashboardLayout Wrapper

**Severity: 🟡 Medium**
Use `<DashboardLayout>` for consistency. All future layout changes apply automatically.

---

### 3.5 Category Delete Has No Orphan Reference Check

**Severity: 🟡 Medium**
**File:** `client/src/lib/services/category.ts`

`deleteCategory()` deletes the doc with no query for dependent blog posts, videos, or albums. Those items hold dangling FK references.

**Fix:** Query all three collections for `categoryId`; show warning if orphans exist; update or nullify references on confirm.

---

### 3.6 Slug Uniqueness Not Validated Before Save

**Severity: 🟡 Medium**
Two posts with identical titles produce duplicate slugs. The second is permanently unreachable at its canonical URL.

**Fix:** Query Firestore for existing document with same slug before save; auto-append `-2`, `-3` if collision detected.

---

### 3.7 Comment Moderation Is Effectively Dead

**Severity: 🟡 Medium**
`comments.ts` auto-approves every comment (`status: 'approved'`). The moderation page fetches pending comments — the pending queue is always empty. Additionally, Firestore rule uses `isOwner()` for comment update/delete, blocking additional admins from moderating.

**Fix:** Default `status: 'pending'`; let moderation page approve/reject. Update rules to allow all admins to moderate.

---

### 3.8 ContentCalendar Imports `db` Directly — 25KB Monolithic Component

**Severity: 🟢 Low**
691-line component directly calling Firestore. Extract hooks `useContentCalendar`, `useScheduledPosts`. The `htmlAttributes` TypeScript error at line 461 indicates a Tiptap extension API mismatch.

---

## SECTION 4 — MEDIA DISPLAY DEEP DIVE

### 4.1 `OptimizedImage` Component Built but Never Used in Any Public Page

**Severity: 🟡 Medium**
**File:** `client/src/components/OptimizedImage.tsx`

Fully featured IntersectionObserver lazy loader with blur-up effect, `srcset`, progressive loading, and error fallback. Used nowhere in `Photos.tsx`, `Blog.tsx`, or `Home.tsx`. All public pages use raw `<img>` tags.

**Fix:** Replace all public-page `<img>` with `<OptimizedImage>`.

---

### 4.2 `generateResponsiveImageUrls` Contains Fragile String Manipulation

**Severity: 🟡 Medium**
**File:** `client/src/lib/utils.ts`

1. Assumes all Storage URLs contain `/photos/` literal — Firebase Storage URLs are encoded and do not match this pattern
2. Assumes all files have `.webp` extension — JPEG/PNG/HEIC uploads produce no replaceable suffix
3. The "optimized" paths are computed but those files only exist if separately uploaded

**Fix:** Store all four size variant URLs explicitly at upload time; return them directly from the upload service rather than deriving them.

---

### 4.3 `deletePhotoAlbum` Does Not Clean Firebase Storage

**Severity: 🟡 Medium**
**File:** `client/src/lib/services/photo.ts`

Firestore documents deleted; no image files removed from Storage. Orphaned Storage objects accumulate indefinitely, incurring ongoing costs.

**Fix:** Enumerate Storage paths from photo documents before deletion; call `deleteObject()` for each variant.

---

### 4.4 VideoDetail Does Not Support TikTok Embed URLs

**Severity: 🟡 Medium**
**File:** `client/src/pages/VideoDetail.tsx`

`getEmbedUrl` handles YouTube and Vimeo. TikTok URLs fall through to an external link. A TikTok `VideoEntry` renders no embedded player.

**Fix:** Add TikTok to `getEmbedUrl` using the `getTikTokEmbedUrl` utility already in `utils.ts`.

---

### 4.5 Photo Upload Uses Sequential Loop for Multi-File Processing

**Severity: 🟡 Medium**
**File:** `client/src/pages/admin/PhotoEdit.tsx`

`for...of` with sequential `await` on 8 operations per file = 160 sequential ops for a 20-photo album.

**Fix:** Use `Promise.all` with a concurrency limiter (e.g., chunks of 5) for parallel upload processing.

---

## SECTION 5 — CLOUD FUNCTIONS DEEP DIVE

### 5.1 Algolia Sync Has No Error Handling, Retry Logic, or Failure Alerting

**Severity: 🟡 Medium**
**File:** `functions/src/index.ts`

Firestore triggers call Algolia API without `try/catch`. A single Algolia outage or key rotation silently leaves the search index stale forever. No retry, no dead-letter queue, no Cloud Monitoring alarm.

**Fix:** Wrap all Algolia calls in `try/catch`; log structured errors; consider Firestore-backed retry queue.

---

### 5.2 HTTPS `api` Function Uses Wildcard CORS

**Severity: 🟡 Medium**
`"Access-Control-Allow-Origin": "*"` allows any site to proxy through this function, using this project's API keys and quota. Restrict to the app's owned domain(s).

---

### 5.3 TikTok Function Has No Token Expiry or Refresh Logic

**Severity: 🟡 Medium**
TikTok Display API tokens expire. No TTL check, no refresh logic. Expired token silently falls to `FALLBACK_COMMENTS` with no log or alert.

---

### 5.4 Functions TypeScript Version Behind Client (4.9 vs 5.x)

**Severity: 🟢 Low**
Upgrade `functions/package.json` `typescript` to `^5.0.0` to match client.

---

## SECTION 6 — PLANNED BUT NOT IMPLEMENTED FEATURES

### 6.1 All AI Content Creation Tools Are Mocks

**Severity: 🟡 Medium**
**File:** `client/src/lib/services/ai.ts`

Every method uses `await delay()` and returns hardcoded template strings. Functions affected: `generateVideoDescription`, `generateBlogPost`, `generateTags`, `generateSeoMeta`, `generateAltText`, `generateTitleIdeas`, `predictPerformance`. No real AI model is connected. Output appears functional in UI but is purely fabricated.

**Fix:** Wire all methods to the deployed Cloud Function `api` endpoint that calls Gemini 1.5 Flash (already implemented in `functions/src/ai.ts`).

---

### 6.2 Two Parallel AI Client Modules with Overlapping Responsibilities

**Files:** `client/src/lib/ai.ts` · `client/src/lib/services/ai.ts`

Both are imported in `VideoEdit.tsx`. Both are stubs. Consolidate into single `services/ai.ts`; remove `lib/ai.ts`.

---

### 6.3 Instagram Feed Is Static Placeholder

**Severity: 🟡 Medium**
**File:** `client/src/components/InstagramFeed.tsx`

No API connection, no data fetching, no environment variable references. Pure layout mock.

**Fix Options:**
1. Connect to Instagram Basic Display API (requires Facebook App approval)
2. Connect to Instagram oEmbed API (no auth, public posts only)
3. Replace with curated Firestore-backed "social highlights" feed managed from admin

---

### 6.4 Newsletter Has No Email Distribution

**Severity: 🟡 Medium**
Subscribers stored in Firestore (currently blocked by rules — see 1.4). No welcome email, no campaign delivery. Firebase Trigger Email Extension not configured. No email provider connected.

**Fix:** 
1. Fix rules field name mismatch
2. Install Firebase Trigger Email Extension with SendGrid or SMTP config
3. Add `mail` collection rules
4. Deploy background function to manage subscriber lists and broadcast campaigns

---

### 6.5 Algolia Client Uses v4 `initIndex` API — Deprecated in v5

**Severity: 🟢 Low**
`initIndex()` removed in v5. Pin to `algoliasearch@4.x` in `package.json` to prevent accidental breakage, and add a migration note for v5.

---

### 6.6 `APPLE_APP_URL` and `ANDROID_APP_URL` Are Empty Strings

**File:** `client/src/const.ts`

If no mobile app is planned, remove the app store badge rendering from `Footer.tsx`. Otherwise, populate with real URLs.

---

## SECTION 7 — FIRESTORE RULES & INDEXES GAPS

### 7.1 Users Can Self-Promote to Admin via Unrestricted Profile Write

See Section 2.2. Root fix is in `firestore.rules`:
```javascript
match /users/{userId} {
  allow read: if true;
  allow write: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['role', 'uid', 'createdAt']);
}
```

---

### 7.2 Newsletter Subscribers Rule Accepts Unauthenticated Spam

`allow create: if true` — completely open. Add email format validation and key restriction:
```javascript
allow create: if request.resource.data.keys().hasOnly(['email', 'subscribedAt', 'source'])
  && request.resource.data.email is string
  && request.resource.data.email.matches('.*@.*\\..*');
```

---

### 7.3 Five Missing Composite Indexes

These queries exist in code but have no covering index in `firestore.indexes.json`. Firestore returns empty result sets silently:

| Collection | Query Fields | Used In |
|---|---|---|
| `comments` | `postId, postType, status, createdAt` | `comments.ts` |
| `categories` | `type, createdAt` | `services/category.ts` |
| `scheduledPosts` | `scheduledAt (range), scheduledAt (order)` | `services/schedule.ts` |
| `destinations` | `status, date` | `services/destination.ts` |
| `videos` | `status, publishedAt` | `services/video.ts` |

**Fix:** Add all five to `firestore.indexes.json` and deploy with `firebase deploy --only firestore:indexes`.

---

### 7.4 Storage Rules Use Only Email Matching — Ignores Custom Claims

**File:** `storage.rules`

`isAdmin()` in storage rules calls only `isAdminEmail()`. An admin set via `setAdminClaim` can write to Firestore but receives `permission-denied` from Storage.

**Fix:** Mirror Firestore's `isAuthorizedAdmin()` in `storage.rules`:
```javascript
function isAuthorizedAdmin() {
  return isAdminEmail() || request.auth.token.role == 'admin';
}
```

---

### 7.5 Hardcoded Admin Emails Are a Permanent Backdoor

**Files:** `firestore.rules` · `storage.rules`

Three email addresses grant unconditional admin write access. Account compromise = full site compromise.

**Fix:** Remove hardcoded email list from rules entirely; rely exclusively on custom claims. Maintain an emergency recovery procedure via Firebase Console Admin SDK.

---

### 7.6 `contact_messages` and `mail` Collections Have No Rules

See Sections 1.2 and 1.3. Add explicit rule blocks for both:
```javascript
match /contact_messages/{docId} {
  allow create: if true;  // public form
  allow read, update, delete: if isAuthorizedAdmin();
}
match /mail/{docId} {
  allow create: if request.auth != null;
  allow read, update, delete: if false;  // extension-only
}
```

---

## SECTION 8 — UI/UX ISSUES

### 8.1 Navigation Uses Deprecated wouter v3 Double-Nesting Pattern

**File:** `client/src/components/Navigation.tsx`

```tsx
// WRONG — creates <a> inside <a>
<Link href="/blog"><a className="...">Blog</a></Link>

// CORRECT (wouter v3)
<Link href="/blog" className="...">Blog</Link>
```

Causes invalid HTML, unpredictable browser rendering, screen reader misreading, SEO crawl issues.

---

### 8.2 No Active State on Navigation Links

Add `useRoute` from wouter to highlight the current route. Essential UX — user has no navigation context.

---

### 8.3 Mobile Menu Missing Login Link for Unauthenticated Users

Desktop shows login link; mobile hamburger does not. Mobile users cannot log in from the main navigation.

---

### 8.4 `Destination.tsx` Uses Third-Party `via.placeholder.com`

Replace with local SVG placeholder or a Firebase Storage fallback image.

---

### 8.5 `ContentCalendar.tsx` — 25KB Monolith

Extract `useContentCalendar`, `useScheduledPosts`, `CalendarCell`, `ScheduleModal`, `AIRepurposePanel` sub-components. Fix Tiptap `htmlAttributes` API error at line 461.

---

## SECTION 9 — INTEGRATIONS STATUS

| Integration | Status | Action Required |
|---|---|---|
| **Firebase Auth (Google/Microsoft)** | ✅ Functional | None |
| **Firestore CRUD** | ⚠️ 4 broken flows | Fix rules + field names |
| **Algolia Search** | ⚠️ Wired, config required | Add missing indexes; error handling |
| **TikTok Comments** | ⚠️ Functional with fallback | Add token expiry handling |
| **YouTube Live Chat** | ⚠️ Real iframe | Requires active stream — document this |
| **AI Persona Comments (Gemini)** | ⚠️ Real with fallback | Wire admin prompt config |
| **AI Blog/Video Tools** | 🚫 100% Mock | Wire to Cloud Function Gemini endpoint |
| **AI Caption Generator** | 🚫 Stub | Consolidate with `services/ai.ts` |
| **Instagram Feed** | 🚫 Static placeholder | Implement oEmbed API or Firestore feed |
| **Newsletter Email Delivery** | 🚫 Broken end-to-end | Fix rules + deploy Trigger Email Extension |
| **Firebase Storage** | ⚠️ Uploads work; no cleanup | Add Storage cleanup on delete |
| **Firebase Analytics** | ⚠️ Wired, opt-in | Document opt-in requirement |
| **Firebase App Check** | 🚫 Not configured | Implement for abuse protection |

---

## SECTION 10 — NEW FEATURES FOR NEXT-GEN CONTENT CREATOR PLATFORM

These features are not in any current plan but are high-impact additions:

### 10.1 Real-Time View Counter (Firestore onSnapshot)
Show live viewer count per blog post and video using Firestore real-time listeners. No separate analytics service needed.

### 10.2 "Shop the Look" Integration with Affiliate Deep Links
`ShopTheLook.tsx` exists. Wire it to a Firestore `shoppable_items` collection managed from admin. Each item = image region + product URL + optional affiliate tag. Track clicks via Cloud Function.

### 10.3 AI-Powered Content Brief Generator
User inputs a topic/hashtag → Gemini generates a full content brief: hook ideas, outline, caption options, hashtag clusters, best posting time prediction. Wire to existing Gemini Cloud Function.

### 10.4 Auto-Scheduled Social Posting
Admin selects published content + scheduled time → Cloud Function queues a pub/sub message → triggers posting to Instagram Graph API, TikTok Creator API, or generates formatted tweet/thread.

### 10.5 Fan Membership / Gated Content Tier
Add `membershipTier: 'free' | 'fan' | 'vip'` to `BlogPost` and `Video`. Gate display behind Firestore rules + client-side check. Integrate Stripe Checkout for one-click subscription upgrades.

### 10.6 "Behind-the-Scenes" Photo Stories
A vertical swipe story format (similar to Instagram Stories) built on the existing photo/album system. Albums with `type: 'story'` render in story format with progress bar, tap-to-advance, overlaid text captions.

### 10.7 Email Newsletter Builder (WYSIWYG → Campaign)
Admin composes newsletter in `RichTextEditor`; preview renders as email HTML; one-click broadcast to all `newsletterSubscribers` via Firebase Trigger Email Extension. Delivery stats tracked in Firestore.

### 10.8 SEO Auto-Optimization Pipeline
On every blog post save, Cloud Function calls Gemini to: (a) generate meta description if missing, (b) suggest 5 semantic title variants, (c) score the post for readability and keyword density. Results stored in Firestore and shown in admin sidebar.

### 10.9 Content Performance Dashboard
Admin dashboard: views per post, engagement rate, average read time (tracked via `analytics.ts` scroll events), top referrers, top-performing content by category. All sourced from Firebase Analytics + Firestore counters.

### 10.10 Progressive Web App (PWA) Enhancement
`sw.js` and `manifest.json` already exist. Add offline-first strategy: cache last 20 blog posts, cache all images via Workbox, add "install" prompt. Enable push notifications for new content.

---

## IMPLEMENTATION ORDER

### Phase 1 — Fix What Is Broken (P0s, before any deployment)
1. Fix TypeScript syntax error in `user.ts` (build blocker)
2. Fix 14 TypeScript type errors across 5 files
3. Fix Firestore rules: `contact_messages`, `mail`, `newsletterSubscribers`
4. Fix `subscribedAt` → `createdAt` field name in rules (or vice versa in code)
5. Export `setAdminClaim` from `functions/src/index.ts`
6. Add bootstrap script to set first admin claim via Admin SDK
7. Fix `isAuthenticated = Boolean(firebaseUser)` in `useAuth.ts`
8. Add `role` field protection to Firestore rules
9. Add 5 missing composite indexes to `firestore.indexes.json`
10. Fix wouter `<Link>` double-nesting in Navigation

### Phase 2 — Security Hardening
1. Remove hardcoded admin emails from rules; use claims only
2. Sync `storage.rules` to use `isAuthorizedAdmin()` (claims + email)
3. Add Firebase App Check
4. Add field-level write restriction on `users/{uid}` for `role`, `uid`, `createdAt`
5. Add rate limiting / App Check to newsletter subscription
6. Fix `getIdTokenResult(false)` → `getIdTokenResult(true)` for claim refresh

### Phase 3 — Admin Portal Hardening
1. Fix `PhotoEdit` data-loss race (batch writes + await before navigate)
2. Add "New Content" button headers to all list pages
3. Fix `VideoEdit` storage path (`blog/` → `videos/thumbnails/`)
4. Wrap `DestinationEdit` in `DashboardLayout`
5. Add orphan check to `deleteCategory`
6. Add slug uniqueness validation
7. Fix comment moderation (default `pending`, update rules)
8. Fix `ContentCalendar` TypeScript error + extract sub-components

### Phase 4 — Media & Performance
1. Replace all public-page `<img>` with `<OptimizedImage>`
2. Fix `generateResponsiveImageUrls` to store URLs at upload time
3. Add Storage cleanup to `deletePhotoAlbum`
4. Add TikTok embed to `VideoDetail`
5. Convert photo upload loop to concurrent `Promise.all`
6. Add mobile login link to Navigation hamburger menu
7. Add active state to Navigation links

### Phase 5 — Feature Completion
1. Wire all `services/ai.ts` stubs to Cloud Function Gemini endpoint
2. Consolidate `lib/ai.ts` into `services/ai.ts`; remove duplicate
3. Implement Instagram oEmbed feed or Firestore-backed social highlights
4. Configure Firebase Trigger Email Extension + deploy newsletter
5. Add Algolia error handling and retry to Cloud Functions
6. Restrict HTTPS `api` function CORS to owned domain
7. Add TikTok token expiry detection
8. Fix `APPLE_APP_URL`/`ANDROID_APP_URL` (populate or remove)
9. Remove `via.placeholder.com` from Destination page

### Phase 6 — New Features (Next-Gen Platform)
1. Real-time view counter
2. Shop the Look Firestore integration
3. AI content brief generator
4. Email newsletter builder + campaign broadcast
5. SEO auto-optimization pipeline
6. Content performance dashboard
7. PWA enhancement + push notifications
8. Behind-the-scenes photo stories format
9. Gated content / fan membership tier (Stripe)
10. Auto-scheduled social posting pipeline

---

## IMPLEMENTATION NOTES

- All Cloud Function changes require `firebase deploy --only functions` after code changes
- All Firestore rules changes require `firebase deploy --only firestore:rules`
- All index changes require `firebase deploy --only firestore:indexes`
- Storage rules changes require `firebase deploy --only storage`
- The `setAdminClaim` bootstrap must run against a Firebase project with Admin SDK credentials before any admin can log in
- Feature flags (`VITE_ENABLE_*`) should gate Phase 6 features for gradual rollout
- App Check must be configured in Firebase Console before the frontend enforcement can be enabled
