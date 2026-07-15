# Final Phase — Secrets Architecture Migration (TF + GCP Secret Manager + OIDC)

> **IMPLEMENTED 2026-07-15.** Live state:
> - **Zero GitHub repository secrets** (all 10 deleted). CI authenticates via
>   OIDC/WIF using the `GCP_WORKLOAD_IDENTITY_PROVIDER` and
>   `GCP_SERVICE_ACCOUNT` repository *variables*; the deploy identity is the
>   Terraform-managed `github-deploy@simplysoph-66c78.iam.gserviceaccount.com`.
> - **Terraform Cloud org `SimplySoph`, workspace `SimplySoph`** (dedicated
>   TFC account — deliberately separate from any other project's org) owns the
>   Secret Manager catalog, WIF pool/provider, and deploy IAM from
>   `platform/terraform/`. TFC↔GCP is keyless (dynamic credentials via the
>   out-of-band `terraform-cloud` pool; trust condition pins org+workspace).
> - **Populated secrets**: the two newsletter HMAC tokens (bound via
>   defineSecret on the `api` function). The six vendor secrets are empty
>   containers pending rotation — add their values to the sensitive
>   `firebase_runtime_secret_values` TFC workspace variable and move their
>   `defineSecret()` into the binding lists in `functions/src/index.ts`.
> - **Remaining**: rotate + populate vendor keys (step 1 below); revoke the
>   two orphaned SA JSON keys (firebase-adminsdk, github-action) and strip the
>   legacy deploy roles from firebase-adminsdk once nothing else uses them.

Deferred final phase from the 2026-07-14 third-pass review. Modeled on the
proven architecture in `saulpatinojr/Personal-Site_HCW`
(`platform/terraform/secrets.tf`, `documentation/security/secret-architecture-reset.md`),
adapted to this project — **but fully independent of it**: different repo,
different GCP project, different Terraform Cloud account/org. Nothing in this
phase blocks the shipped code changes; everything here removes standing
credentials.

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

| Secret Manager name | Consumer | Never use VITE_* |
|---|---|---|
| `GEMINI_API_KEY` | `api` function (`/ai/generate`, `/ai/persona-replies`) | **Use only `process.env.GEMINI_API_KEY` in Cloud Functions; never embed in client** |
| `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_INDEX_NAME` | Algolia sync triggers | Use `process.env` server-side only; `VITE_ALGOLIA_SEARCH_KEY` is public |
| `TIKTOK_ACCESS_TOKEN` | `/tiktok/comments` proxy | **Must use `process.env.TIKTOK_ACCESS_TOKEN`, never VITE_** |
| `INSTAGRAM_ACCESS_TOKEN` | `/instagram/media` proxy | **Must use `process.env.INSTAGRAM_ACCESS_TOKEN`, never VITE_** |
| `UNSUBSCRIBE_TOKEN_SECRET`, `NEWSLETTER_CONFIRM_TOKEN_SECRET` | newsletter HMAC links | **Must use `process.env` in Functions, never client-side** |
| `CONTACT_RECIPIENT`, `NEWSLETTER_FROM`, `SITE_URL` | config, may stay plain env | Non-secret config; safe as env vars or config files |

## Critical principle: Never VITE_* for secrets

**VITE_* environment variables are embedded in the client bundle at build time —
they are public and immutable once deployed.** Under no circumstances should
`VITE_GEMINI_API_KEY`, `VITE_TIKTOK_ACCESS_TOKEN`, `VITE_ALGOLIA_ADMIN_KEY`,
or any other sensitive credential ever exist in the codebase.

All secrets use `process.env` in Cloud Functions only (server-side at runtime).
The only VITE_* vars in use are non-secrets: public Firebase web config
(fetched at CI time), Algolia SEARCH-ONLY key, and feature flags (video IDs,
domains, etc.). Audit config.ts and main.tsx before every CI run to verify.

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
