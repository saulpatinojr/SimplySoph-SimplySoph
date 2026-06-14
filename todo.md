# TODO — SimplySoph

> Track open tasks, ideas, and known issues.  
> Format: `- [ ]` open · `- [x]` done · 🔴 blocking · 🟡 nice-to-have

---

## 🔥 In Progress

- [ ] Lighthouse CI — add `LHCI_GITHUB_APP_TOKEN` secret in GitHub Settings → Secrets → Actions (manual step)
- [ ] Algolia — add `VITE_ALGOLIA_APP_ID`, `VITE_ALGOLIA_WRITE_KEY`, `VITE_ALGOLIA_INDEX_NAME` secrets once Algolia account is set up

---

## 🟥 Bugs / Known Issues

> All previously reported bugs have been resolved. See ✅ Done below.

---

## 🟦 Up Next (v0.3)

- [ ] Comments — nested reply threads
- [ ] Blog — draft / scheduled post support
- [ ] Dark mode — persist preference to Firestore per user
- [ ] Travel / Passport page — interactive map pin view
- [ ] Push notifications — new post alerts via Firebase Cloud Messaging
- [ ] Unit tests — expand Vitest coverage for lib helpers
- [ ] E2E tests — add Playwright smoke tests for critical paths
- [ ] Image optimisation — auto-convert uploads to WebP via Cloud Functions
- [ ] Sitemap — auto-generate `sitemap.xml` on build
- [ ] OG images — dynamic Open Graph image generation per post

---

## 🟡 Nice-to-Have

- [ ] Admin — bulk photo delete with confirmation
- [ ] Blog — table of contents sidebar for long posts
- [ ] Analytics dashboard page inside admin
- [ ] `useNewsletterModal` — auto-trigger after 60 s first visit
- [ ] Offline support — Firestore persistence + service worker
- [ ] Search — Algolia InstantSearch UI (replace Firestore `array-contains-any` once keys are set)

---

## ✅ Done (v0.2.0-beta)

- [x] Algolia index sync — `algolia.ts` service wired into `saveBlogPost`, `deleteBlogPost`, `savePhotoAlbum`, `deletePhotoAlbum` (no-op when env vars absent)
- [x] Blog — related posts section (`RelatedPosts` component, `categoryId` prop fix)
- [x] Blog — reading progress bar (fixed top bar tracking scroll depth)
- [x] Admin PhotoEdit — drag-to-reorder photos within an album (HTML5 drag-and-drop)
- [x] Navigation — Cmd+K / Ctrl+K global shortcut opens search bar
- [x] Navigation — mobile drawer closes on route change (`useEffect` on `location`)
- [x] PhotoCarousel — keyboard ArrowLeft / ArrowRight navigation
- [x] Contact form — `mailto:` URL capped at 1200 chars with truncation notice
- [x] lighthouserc.cjs — `startServerReadyPattern` matches `vite preview` port 4173 ✓
- [x] ContentCalendar — events use `line-clamp` + `truncate`; side panel detail view (no tooltip overflow)
- [x] GitHub Wiki — live at [/wiki](https://github.com/saulpatinojr/SimplySoph-SimplySoph/wiki) with Home, Secrets & Variables, Changelog, TODO pages
- [x] Blog — editorial magazine grid
- [x] Blog — category filter bar
- [x] BlogPost — reading time + like button + share bar
- [x] ShareButtons — Web Share API + clipboard fallback
- [x] SearchBar — debounce + error state + aria semantics
- [x] Navigation — frosted glass scroll effect
- [x] PhotoEdit — dynamic categories select
- [x] NewsletterModal — `useNewsletterModal` hook
- [x] Fix all Vite/Rollup build errors (13 files patched)
- [x] Lighthouse CI workflow + `lighthouserc.cjs`
- [x] `npm audit fix` — 32 packages updated
- [x] `vite.config.ts` — `@emailjs/browser` externalised
- [x] Navigation — `SearchBar` named import fix
- [x] Tailwind v4 `btn-gold @apply` fix
