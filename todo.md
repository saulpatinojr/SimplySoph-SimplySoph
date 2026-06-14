# TODO — SimplySoph

> Track open tasks, ideas, and known issues.  
> Format: `- [ ]` open · `- [x]` done · 🔴 blocking · 🟡 nice-to-have

---

## 🔥 In Progress

- [ ] Wire Algolia index write on Firestore blog/photo create/update
- [ ] Lighthouse CI — add `LHCI_GITHUB_APP_TOKEN` secret for PR status checks
- [ ] Admin PhotoEdit — drag-to-reorder photos within an album
- [ ] Blog — related posts section at article bottom

---

## 🟥 Bugs / Known Issues

- [ ] 🔴 `vite preview` on CI uses port 4173 but Lighthouse config expects it — verify `startServerReadyPattern` matches
- [ ] Mobile nav drawer doesn’t close on route change
- [ ] `ContentCalendar` — event tooltips overflow on small screens
- [ ] `PhotoCarousel` — keyboard arrow navigation not yet wired
- [ ] Contact form — `mailto:` fallback URL can exceed browser limit for long messages

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
- [ ] Blog — reading progress bar
- [ ] Blog — table of contents sidebar for long posts
- [ ] Search — keyboard shortcut (`Cmd+K`) to focus SearchBar
- [ ] Analytics dashboard page inside admin
- [ ] `useNewsletterModal` — auto-trigger after 60 s first visit
- [ ] Offline support — Firestore persistence + service worker

---

## ✅ Done (v0.2.0-beta)

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

---
