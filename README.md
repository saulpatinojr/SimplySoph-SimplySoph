# SimplySoph — v0.2.0-beta

> Personal creative platform for Sophie — blog, photo albums, travel journal, and social media integration.

[![Build & Deploy](https://github.com/saulpatinojr/SimplySoph-SimplySoph/actions/workflows/deploy.yml/badge.svg)](https://github.com/saulpatinojr/SimplySoph-SimplySoph/actions/workflows/deploy.yml)
[![Lighthouse CI](https://github.com/saulpatinojr/SimplySoph-SimplySoph/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/saulpatinojr/SimplySoph-SimplySoph/actions/workflows/lighthouse.yml)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| UI Components | Radix UI, Lucide React, Framer Motion, Sonner |
| Rich Text | Tiptap v3 |
| Backend / DB | Firebase (Auth, Firestore, Storage, Hosting) |
| Search | Algolia |
| Email | EmailJS (optional, env-gated) |
| CI/CD | GitHub Actions |
| Performance | Lighthouse CI (`@lhci/cli`) |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/saulpatinojr/SimplySoph-SimplySoph.git
cd SimplySoph-SimplySoph

# 2. Install dependencies
npm install

# 3. Copy env template and fill in values
cp .env.example .env

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the project root (never commit it).

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# App
VITE_APP_TITLE=SimplySoph
VITE_OWNER_FIREBASE_UID=         # UID of the admin user
VITE_ENABLE_REALTIME_FEED=true
VITE_FIREBASE_FUNCTIONS_REGION=us-central1

# EmailJS (optional — contact form)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=

# Algolia (optional — search)
VITE_ALGOLIA_APP_ID=
VITE_ALGOLIA_SEARCH_KEY=
```

> For CI/CD secrets see the [GitHub Wiki → Secrets & Variables](../../wiki/Secrets-and-Variables).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest unit tests |
| `npm run format` | Prettier format all files |
| `npm run lighthouse` | Full Lighthouse CI audit |
| `npm run lighthouse:collect` | Collect Lighthouse reports only |
| `npm run lighthouse:assert` | Assert score thresholds |

---

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── _core/          # Auth hooks, Firebase clients
│   │   ├── components/     # Reusable UI components
│   │   ├── components/ui/  # Shadcn-style base components
│   │   ├── lib/            # Firebase helpers, search, analytics
│   │   ├── pages/          # Route-level pages
│   │   ├── pages/admin/    # Admin-only pages
│   │   └── const.ts        # App-wide constants
│   └── public/         # Static assets, fonts
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Build + Firebase deploy
│       ├── lighthouse.yml          # Lighthouse performance audit
│       ├── firebase-hosting-merge.yml
│       └── firebase-hosting-pull-request.yml
├── lighthouserc.cjs    # Lighthouse CI configuration
├── vite.config.ts
├── package.json
├── CHANGELOG.md
├── TODO.md
└── README.md
```

---

## Performance Targets (Lighthouse)

| Category | Min Score |
|---|---|
| Performance | ≥ 80 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

Run locally: `npm run lighthouse`

---

## Deployment

Push to `main` → GitHub Actions builds and deploys to **Firebase Hosting** automatically.  
Pull requests get a preview channel URL posted as a PR comment.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

---

## License

MIT © SimplySoph
