# SimplySoph — Verified TODO

> Last source audit: 2026-07-12. This file contains open work only. Completed items were removed after checking the current repository. Prior history remains in `CHANGELOG.md` and `docs/`.
>
> Priority: **P0** release blocker · **P1** high · **P2** normal · **P3** optional.
> Every code task needs tests or a documented verification step before it is removed.

## P0 — Release blockers

- [ ] **Close remaining post-hardening follow-ups from completed security phase.**
  - [ ] Decide and document whether guest comments are supported.
  - [ ] Replace newsletter unsubscribe client-updates with signed, expiring unsubscribe tokens through a server endpoint.
  - [ ] Add durable AI usage accounting and billing/abuse alerting.
  - [ ] Add route tests for guest, normal user, stale admin token, and admin.

- [ ] **Restore a trustworthy clean build.** A fresh checkout currently has no installed dependencies, saved error files are stale, and CI allows type-check failures.
  - [ ] Choose npm or pnpm; keep only its lockfile and declare the package manager/version in `package.json`.
  - [ ] Add explicit root scripts for `typecheck`, `lint`, client tests, Functions tests, rules tests, and E2E tests.
  - [ ] Remove `continue-on-error: true` from CI type checking.
  - [ ] Build and test both the client and `functions` workspace in CI.
  - [ ] Remove committed `build_error.txt` and `errors.txt`; CI artifacts/logs are the source of truth.
  - [ ] Prevent deployment unless install, type-check, tests, rules tests, and production build pass.

- [ ] **Consolidate the three overlapping Firebase deployment workflows.** There is a hand-written pipeline plus generated merge and PR workflows, which can duplicate builds/deployments.
  - [ ] Keep one preview workflow and one production path, or one conditional workflow.
  - [ ] Deploy Hosting, Functions, Firestore rules, Storage rules, and indexes deliberately; the current production flow does not provide a trustworthy all-resource release.
  - [ ] Replace deprecated `FIREBASE_TOKEN` deployment with the service-account/OIDC approach used by the Hosting action.
  - [ ] Add environment protection and a documented rollback procedure.

## P1 — Broken behavior and data integrity

- [ ] **Fix public routing and run an internal-link crawl.** Navigation and Footer advertise `/passport`, but `App.tsx` has no Passport route.
  - [ ] Add routes for Passport and destination detail pages.
  - [ ] Add intentional routes or delete dead pages for Media Kit, Privacy Policy, and Terms of Service.
  - [ ] Ensure `/privacy-policy` and `/terms-of-service` links in `client/index.html` resolve.
  - [ ] Add missing admin routes for Destination list/create/edit, or remove the unused admin pages and destination navigation affordances.
  - [ ] Add an automated crawl asserting that every internal link returns the intended page rather than the SPA 404.

- [ ] **Simplify the router composition.** Move `Suspense` outside `Switch` or wrap each route element so Wouter evaluates direct route children predictably; order specific admin routes before `/admin` and add routing regression tests.

- [ ] **Replace hard-coded admin email fallbacks.** Admin identities are copied into client services, Firestore rules, and Storage rules.
  - [ ] Use server-issued custom claims as the steady-state authority.
  - [ ] Provide a documented, audited bootstrap/revocation process through `setAdminClaim`.
  - [ ] Remove email allowlists after claims are verified in production.

- [ ] **Put abuse-prone public writes behind controlled server endpoints.** Cover newsletter signup, contact submissions, guest comments, and analytics events.
  - [ ] Add App Check/bot protection, throttling, field allowlists, length limits, duplicate suppression, and retention rules.
  - [ ] Prevent clients from choosing moderation state, timestamps, ownership fields, or arbitrary extra fields.
  - [ ] Add spam quarantine and operational alerts.

- [ ] **Unify the creator profile model.** Use one vocabulary (`uid`, `displayName`, `photoURL` or an intentionally mapped alternative) across `CreatorProfile`, Comments, DashboardLayout, authentication, and Firestore documents.
  - [ ] Remove unsafe profile casts.
  - [ ] Add a migration/default strategy for existing documents.
  - [ ] Test first login, returning login, missing profile, admin promotion, and demotion.

- [ ] **Make scheduled publishing real or rename it.** The calendar stores `scheduledPosts`, but no scheduled publisher is exposed by the Functions entry point.
  - [ ] If it is planning-only, label it “Content Calendar” and remove claims of automatic publishing.
  - [ ] If publishing is required, implement token storage, scheduled execution, idempotency, retries, platform error states, reconciliation, and audit logs.

- [ ] **Complete publication semantics.** Draft/scheduled fields exist, but verify the complete lifecycle: draft → preview → scheduled → published → archived.
  - [ ] Add private preview links with expiry.
  - [ ] Add a scheduled function for blog/video/photo publication if automatic publication is intended.
  - [ ] Prevent draft metadata and media from public Firestore/Storage access and search indexes.
  - [ ] Test timezone and daylight-saving boundaries.

- [ ] **Fix configuration behavior across environments.** `firebase.ts` forces any `firebaseapp.com` auth domain to `simplysoph.com`, which can break previews, local development, and alternate projects.
  - [ ] Use explicit per-environment configuration and fail fast on missing required variables.
  - [ ] Remove production email/auth logging and gate useful diagnostics behind development mode.

- [ ] **Harden content rendering and outbound content.** Keep DOMPurify on rich HTML and add regression fixtures for scripts, event handlers, unsafe URLs, iframes, and malformed markup.
  - [ ] Define allowed Tiptap nodes/attributes and safe embed hosts.
  - [ ] Validate all external URLs before rendering links, embeds, products, or share destinations.
  - [ ] Add `rel="noopener noreferrer sponsored"` where appropriate and visible affiliate disclosures.

- [ ] **Add real failure states to every data page and mutation.** Verify loading, empty, permission-denied, offline, retry, partial-data, and not-found states for BlogPost, VideoDetail, PhotoAlbum, Passport/Destination, Search, Comments, and admin CRUD.

## P1 — Dead code and repository cleanup

- [ ] **Resolve confirmed unreachable page modules.** Wire them into intentional routes or delete them:
  - [ ] `client/src/pages/Passport.tsx`
  - [ ] `client/src/pages/Destination.tsx`
  - [ ] `client/src/pages/MediaKit.tsx`
  - [ ] `client/src/pages/PrivacyPolicy.tsx`
  - [ ] `client/src/pages/TermsOfService.tsx`
  - [ ] `client/src/pages/admin/DestinationList.tsx`
  - [ ] `client/src/pages/admin/DestinationEdit.tsx`

- [ ] **Resolve confirmed unused components/hooks.** Integrate intentionally or delete them and their dependencies/styles/tests:
  - [ ] `client/src/components/ShopTheLook.tsx`
  - [ ] `client/src/components/NewsletterSignup.tsx`
  - [ ] `client/src/components/AIPersonaComments.tsx`
  - [ ] Duplicate mobile hooks: `hooks/use-mobile.tsx` and `hooks/useMobile.tsx`; retain one API and update imports.

- [ ] **Run a compiler-backed unused-code audit.** Enable `noUnusedLocals` and `noUnusedParameters`, then use a dependency/export checker to find unused exports, packages, assets, and unreachable modules. Review every deletion manually because route entry points and Firebase exports can look unused statically.

- [ ] **Remove generated build output from source control.** `functions/lib/*.js` and source maps should be CI/deploy artifacts unless there is a documented reason to commit them; align `.gitignore` and deployment packaging.

- [ ] **Remove obsolete audit duplication.** Reconcile `docs/ISSUES.md`, `docs/ROADMAP.md`, `docs/IMPROVEMENTS.md`, and old audit reports with this TODO. Keep historical reports clearly dated/read-only; do not maintain multiple competing active backlogs.

- [ ] **Delete or document miscellaneous orphan files.** Review `mock_data.ts`, `.gitkeep`, Firebase local cache output, patches, unused public icons/assets, and any no-longer-used environment templates.

## P2 — Testing, observability, accessibility, and performance

- [ ] **Expand automated tests beyond Search and ImageStack.** Minimum coverage:
  - [ ] Auth redirects and admin claims
  - [ ] Public/admin CRUD success and failure
  - [ ] Firestore and Storage rules
  - [ ] Newsletter, contact, comments, and moderation
  - [ ] Upload type/size/path validation
  - [ ] AI authentication, validation, quotas, and provider failures
  - [ ] Routing/link crawl and dynamic 404s
  - [ ] Scheduled publishing and timezone behavior
  - [ ] PWA install/offline/update behavior
  - [ ] Playwright smoke tests for primary visitor and creator journeys

- [ ] **Add production error monitoring.** Capture client error-boundary failures, rejected Firebase operations, Function latency/errors, failed scheduled jobs, and search/index synchronization failures without collecting sensitive content.

- [ ] **Complete accessibility QA to WCAG 2.2 AA.** Run axe plus keyboard and screen-reader checks for navigation, dialogs, search, carousels, lightbox, rich-text editor, calendar, drag/reorder, forms, validation, focus restoration, reduced motion, contrast, and image alternatives.

- [ ] **Measure performance with enforceable budgets.** Configure Lighthouse thresholds for mobile performance, accessibility, SEO, and best practices; add route-level bundle budgets and inspect Framer Motion, Tiptap, Firebase, and duplicate UI dependencies.

- [ ] **Finish image processing.** Generate responsive AVIF/WebP derivatives, preserve originals privately when appropriate, strip unsafe metadata, validate actual file signatures, limit dimensions/decompression bombs, and clean orphaned uploads.

- [ ] **Choose one service-worker owner.** The app registers `public/sw.js` manually while also depending on `vite-plugin-pwa`; consolidate generation, versioning, update prompts, cache invalidation, and offline fallbacks. Do not cache authenticated/admin responses.

- [ ] **Generate SEO infrastructure.** Add canonical URLs, `sitemap.xml`, `robots.txt`, structured data for creator/article/video/breadcrumb/destination content, and crawlable per-route metadata. Validate social preview images.

- [ ] **Define backup and recovery.** Schedule Firestore/Storage backups, document retention/encryption/access, and perform a restore drill. Include Algolia rebuild and admin-claim recovery.

## P2 — Creator value and conversion

- [ ] **Finish Passport as a differentiated travel hub.** Add map and list views, destination filters, city guides, saved places, itinerary blocks, related outfits/products/posts/videos, season/budget metadata, and structured data.

- [ ] **Activate the Media Kit as a partnership funnel.** Add data-driven audience metrics, case studies, deliverables, downloadable one-sheet, qualified brand inquiry form, source attribution, and stale-metric warnings.

- [ ] **Build a central affiliate product catalog.** Reuse products across posts, videos, albums, and destinations; support retailer alternatives, price/availability, disclosures, link-health checks, clicks, conversions, and campaign attribution. Then integrate or remove the current dead `ShopTheLook` component.

- [ ] **Improve newsletter value and lifecycle.** Add double opt-in, source/UTM attribution, consent timestamps, preference segments, lead magnets, welcome sequence, digest workflow, subscriber export, and safe tokenized unsubscribe.

- [ ] **Create cross-format content relationships.** Model one story across blog, long video, short clips, photos, products, and destinations; expose related content and manage it from one admin workflow.

- [ ] **Add an editorial QA gate.** Require title/slug, cover, alt text, category/tags, disclosure, SEO fields, canonical, related content, valid links, preview, and scheduled/published state before release.

- [ ] **Build conversion-focused analytics.** Track newsletter conversion, partnership leads, product clicks/revenue, search terms and zero-results, related-content continuation, scroll depth, and returning visitors. Define retention and privacy rules before collecting new events.

- [ ] **Add content maintenance workflows.** Flag broken affiliate links, missing images/alt text, outdated products, stale posts, orphaned media, failed search indexing, and content with declining traffic.

- [ ] **Add community features only after abuse controls.** Nested replies, creator/pinned badges, reply notifications, reporting, rate limits, editing, moderation metrics, and clearly labeled AI-generated personas.

## P3 — Optional after foundations are stable

- [ ] Persist theme preference to the user profile with local fallback.
- [ ] Add push notifications with explicit opt-in, topic preferences, unsubscribe controls, and delivery analytics.
- [ ] Add saved visitor collections for outfits, destinations, posts, and products.
- [ ] Add blog table of contents and print-friendly views.
- [ ] Add admin bulk operations with previews, confirmation, undo where feasible, and audit logs.
- [ ] Replace Firestore token search with Algolia only after read-only client keys, server-side indexing, secured secrets, index rebuild tooling, and relevance evaluation are complete.
- [ ] Generate dynamic Open Graph images per content item.

## External/manual decisions

- [ ] Configure and verify required production secrets; never place an Algolia write/admin key in a `VITE_*` variable because those values ship to browsers. Use a search-only key client-side and keep write credentials in Functions secrets.
- [ ] Confirm whether the unused `simplysoph-backend` Firebase web app still exists; remove it in Firebase Console if it has no owner or runtime purpose.
- [ ] Decide which features are truly in scope: public fan accounts, guest comments, AI persona comments, automatic social publishing, affiliate commerce, and push notifications. Delete dormant implementations for rejected features.
- [ ] Verify all social/profile URLs, contact addresses, legal entity details, privacy disclosures, analytics consent requirements, and affiliate/sponsorship disclosures with the site owner.
