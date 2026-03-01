# SimplySoph TODO

> Last updated: 2026-02-28

## Completed (Summary)

All **27 original GitHub issues** have been triaged. 17 feature issues were implemented and
pushed to main. Remaining issues (#2-#9, #16) are grouped into future PRs (AI Integration
and Content Hub). Issue #19 (dark mode) was closed by design.

Core site is live at [simplysoph.com](https://simplysoph.com) with Firebase Hosting,
Google/Microsoft auth, PWA support, and full admin dashboard.

---

## Remaining Work

### Future PR: AI Integration (#2, #3, #4, #5, #6, #7, #8)

- [ ] AI-powered content suggestions
- [ ] Smart tagging and categorization
- [ ] Optimal posting time recommendations
- [ ] Content performance predictions
- [ ] Automated SEO optimization
- [ ] AI image enhancement tools
- [ ] Content A/B testing with AI

### Future PR: Content Hub (#9, #16)

- [ ] Content calendar with scheduling
- [ ] Cross-platform content syndication

### Performance & Infrastructure

- [ ] Firebase query caching (reduce API costs)
- [ ] Image CDN integration (CloudFlare/Imgix)
- [ ] Analytics event tracking (comment posts, newsletter signups, searches)
- [ ] Spam protection for comments (reCAPTCHA v3)
- [ ] Comment pagination (for >20 comments)

### Monetization (Phase 4)

- [ ] E-commerce integration (Shopify, affiliate links)
- [ ] Premium/paywalled content (Stripe)
- [ ] Sponsored content management

### Email & Marketing

- [ ] Deploy Cloud Function trigger for email queue (`mail` collection)
- [ ] Connect email provider (SendGrid or Mailgun)
- [ ] Newsletter analytics tracking
- [ ] Email template customization

### Instagram Feed (#13)

- [ ] Set up Instagram Graph API credentials
- [ ] Replace placeholder data in `InstagramFeed.tsx` with live API
- [ ] Server-side caching for API rate limits

### Search (Phase 2)

- [ ] Advanced filters (category, tag) with match highlighting
- [ ] Migration to Algolia/Meilisearch when traffic exceeds 1K searches/month

### Polish

- [ ] Animated scroll reveal effects (`prefers-reduced-motion` aware)
- [ ] Advanced photo album features (bulk upload, editing tools)

---

## Notes

- **Docs** are in the `docs/` directory (ARCHITECTURE, ROADMAP, CHANGELOG, etc.)
- **Admin** access at `/admin` — requires Firebase Auth with owner UID
- **PWA** support is live (manifest.json + service worker)
- **Auth** providers: Google Sign-In + Microsoft OAuth
