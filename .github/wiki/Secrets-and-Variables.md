# Secrets & Variables — SimplySoph CI/CD

This page lists every GitHub Actions secret and environment variable required to build, deploy, and audit SimplySoph.

> **Where to add them:** GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## Firebase Secrets (Required for build + deploy)

All `VITE_FIREBASE_*` values come from your Firebase project's web app config.

### How to get them
1. Go to [Firebase Console](https://console.firebase.google.com) → select project **simplysoph-66c78**
2. Click the **⚙️ gear icon** → **Project settings** → **General**
3. Scroll to **Your apps** → select the Web app → click **Config** (not CDN)
4. Copy each value from the `firebaseConfig` object

| Secret Name | Where to copy value from |
|---|---|
| `VITE_FIREBASE_API_KEY` | `firebaseConfig.apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `firebaseConfig.authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `firebaseConfig.projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `firebaseConfig.storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `firebaseConfig.messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `firebaseConfig.appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `firebaseConfig.measurementId` |

---

## Firebase Deploy Secrets (Required for hosting deploy)

### `FIREBASE_SERVICE_ACCOUNT`

Used by `FirebaseExtended/action-hosting-deploy` to deploy to Firebase Hosting.

**How to get it:**
1. Firebase Console → **Project settings** → **Service accounts**
2. Click **Generate new private key** → download the JSON file
3. Paste the **entire raw JSON content** (single line or multi-line) as the secret value

### `FIREBASE_TOKEN` _(legacy fallback)_

Used by older Firebase CLI deploys.

**How to get it:**
```bash
npx firebase-tools login:ci
# Copy the printed token and add it as the secret
```

---

## App Secrets (Required for build)

| Secret Name | Value | How to get it |
|---|---|---|
| `VITE_OWNER_FIREBASE_UID` | UID of the admin Firebase user | Firebase Console → **Authentication** → **Users** → copy the UID of Sophie's account |

---

## EmailJS Secrets (Optional — Contact form)

Only needed if you want the Contact page to send emails via EmailJS instead of `mailto:`.  
If these are not set, the form falls back to opening the user’s mail client automatically.

**How to get them:**
1. Sign up or log in at [emailjs.com](https://www.emailjs.com)
2. Create a **Service** (e.g. Gmail) → copy the **Service ID**
3. Create an **Email Template** → copy the **Template ID**
4. Go to **Account** → copy the **Public Key**

| Secret Name | Where to copy value from |
|---|---|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS dashboard → Email Services → Service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS dashboard → Email Templates → Template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS dashboard → Account → Public Key |

---

## Lighthouse CI Secret (Optional — PR status checks)

| Secret Name | Purpose | How to get it |
|---|---|---|
| `LHCI_GITHUB_APP_TOKEN` | Posts Lighthouse score as a PR status check | Follow [LHCI GitHub App setup](https://github.com/apps/lighthouse-ci) → install on repo → copy the token from the setup page |

---

## GitHub Built-in Secret

| Secret Name | Purpose | How to get it |
|---|---|---|
| `GITHUB_TOKEN` | Posts PR comments (preview URL, Lighthouse results) | **Auto-provided by GitHub Actions** — you do not need to add this |

---

## Summary Table

| Secret | Required? | Workflow(s) |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_APP_ID` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_FIREBASE_MEASUREMENT_ID` | ✅ Yes | `deploy.yml`, `lighthouse.yml` |
| `VITE_OWNER_FIREBASE_UID` | ✅ Yes | `deploy.yml` |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Yes | `deploy.yml`, `firebase-hosting-*.yml` |
| `FIREBASE_TOKEN` | ⚠️ Fallback | `deploy.yml` |
| `GITHUB_TOKEN` | ✅ Auto | All |
| `VITE_EMAILJS_SERVICE_ID` | ⭕ Optional | `deploy.yml` |
| `VITE_EMAILJS_TEMPLATE_ID` | ⭕ Optional | `deploy.yml` |
| `VITE_EMAILJS_PUBLIC_KEY` | ⭕ Optional | `deploy.yml` |
| `LHCI_GITHUB_APP_TOKEN` | ⭕ Optional | `lighthouse.yml` |

---

## Where to Insert

1. Navigate to: `https://github.com/saulpatinojr/SimplySoph-SimplySoph/settings/secrets/actions`
2. Click **New repository secret**
3. Enter the exact secret **Name** (case-sensitive) from the table above
4. Paste the **Value**
5. Click **Add secret**

> ⚠️ Secret names must match **exactly** (including `VITE_` prefix) because they map directly to Vite env variables at build time.
