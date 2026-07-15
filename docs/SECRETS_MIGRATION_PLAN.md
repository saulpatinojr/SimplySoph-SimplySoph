# Final Phase — Secrets Architecture Migration (TF + GCP Secret Manager + OIDC)

Deferred final phase from the 2026-07-14 third-pass review. Modeled on the
proven architecture in `saulpatinojr/Personal-Site_HCW`
(`platform/terraform/secrets.tf`, `documentation/security/secret-architecture-reset.md`),
adapted to this project. Nothing in this phase blocks the shipped code changes;
everything here removes standing credentials.

## Target end state (mirrors HCW)

- **Zero GitHub repository secrets.** Only two non-secret repository
  *variables* remain: `GCP_SERVICE_ACCOUNT` and `GCP_WORKLOAD_IDENTITY_PROVIDER`.
- **GitHub Actions → GCP via OIDC/Workload Identity Federation**, replacing the
  `FIREBASE_SERVICE_ACCOUNT_SIMPLYSOPH_66C78` JSON key currently stored in
  GitHub (a long-lived, exfiltratable credential).
- **GCP Secret Manager is the runtime vault** for Functions credentials.
  Terraform (Cloud) owns secret containers, versions, and IAM from one
  sensitive HCL-map workspace variable.
- **Public Firebase web config fetched at CI time** via
  `firebase apps:sdkconfig WEB` after OIDC auth — deletes the seven
  `VITE_FIREBASE_*` GitHub secrets outright (they are public values anyway).
- **Local `.env` holds non-secret behavior flags only.**
- **No PATs, no GitHub App private keys in GitHub secrets.** Use the built-in
  `GITHUB_TOKEN` for repo-local automation; introduce a GitHub App only if a
  workflow ever needs installation-level API access, and document where its
  private key lives (Secret Manager) before enabling it.

## Secret catalog for this project

| Secret Manager name | Consumer |
|---|---|
| `GEMINI_API_KEY` | `api` function (`/ai/generate`, `/ai/persona-replies`) |
| `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_INDEX_NAME` | Algolia sync triggers |
| `TIKTOK_ACCESS_TOKEN` | `/tiktok/comments` proxy |
| `INSTAGRAM_ACCESS_TOKEN` | `/instagram/media` proxy |
| `UNSUBSCRIBE_TOKEN_SECRET`, `NEWSLETTER_CONFIRM_TOKEN_SECRET` | newsletter HMAC links |
| `CONTACT_RECIPIENT`, `NEWSLETTER_FROM`, `SITE_URL` | config, may stay plain env |

## Ordered steps

1. **Rotate first, migrate second.** Any credential that ever sat in GitHub
   secrets or a `VITE_*` build var is presumed exposed. Rotate: Algolia admin
   key (was designed into the client bundle as `VITE_ALGOLIA_WRITE_KEY` —
   rotate even though the code path is now deleted), Gemini key, TikTok and
   Instagram tokens; generate fresh HMAC token secrets.
2. **Terraform scaffold** (`platform/terraform/` in this repo): copy HCW's
   `secrets.tf` pattern — `google_secret_manager_secret` for_each over the
   catalog, versions from a sensitive `firebase_runtime_secret_values` TFC
   workspace variable, `secretAccessor` for the runtime SA,
   `secretmanager.viewer` + `iam.serviceAccountUser` for the deploy SA.
3. **TFC workspace bootstrap** (one-time, out-of-band `gcloud`, per HCW's
   secret-architecture-reset.md): workload identity pool + provider trusting
   `https://app.terraform.io`, attribute condition on org/workspace **name**
   (HCW learned the org-ID claim doesn't match — match names).
4. **GitHub Actions WIF** (one-time `gcloud`): pool + provider trusting
   `https://token.actions.githubusercontent.com`, condition on
   `repository == 'saulpatinojr/SimplySoph-SimplySoph'`; deploy SA gets
   `firebasehosting.admin`, `cloudfunctions.developer`, `firebaserules.admin`,
   `datastore.indexAdmin`, `iam.serviceAccountUser` on the runtime SA — then
   swap `deploy.yml` to `google-github-actions/auth` with
   `workload_identity_provider`/`service_account` repo **variables** and delete
   `FIREBASE_SERVICE_ACCOUNT_SIMPLYSOPH_66C78`.
5. **Functions switch to `defineSecret(...)`** bindings (firebase-functions
   params API) for each catalog secret instead of raw `process.env`.
6. **CI fetches web config** via `apps:sdkconfig` (HCW `deploy-frontend.yml`
   has the exact recipe) and the seven `VITE_FIREBASE_*` GitHub secrets are
   deleted. `VITE_ALGOLIA_APP_ID`/`SEARCH_KEY`/`INDEX_NAME` stay as GitHub
   secrets only until step 2 lands, then become repo variables (they are
   public, search-only values).
7. **Delete the GitHub secrets** that remain: EmailJS trio (dead — code
   removed 2026-07-14), the service-account JSON, the Firebase web config set.
8. **Verify**: a full CI run deploys hosting + functions + rules with zero
   `secrets.*` references except none; `gcloud secrets list` shows the catalog;
   `firebase functions:secrets:access` denied for the deploy SA (viewer only).

## GitHub App guidance (from HCW policy, adopted verbatim)

- Do not add PATs, deploy tokens, SA JSON keys, or GitHub App private keys to
  GitHub secrets.
- Prefer built-in `GITHUB_TOKEN`; prefer OIDC for cloud auth.
- Add a custom GitHub App only when a feature truly needs installation-level
  GitHub API access; store its private key in Secret Manager and document it
  here before enabling.
