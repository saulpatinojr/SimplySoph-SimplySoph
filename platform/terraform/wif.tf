# =============================================================================
# wif.tf — GitHub Actions → GCP keyless authentication
#
# GitHub Actions authenticates via OIDC / Workload Identity Federation: no
# service-account JSON keys, no PATs, nothing to rotate or exfiltrate. Only
# workflow runs from the named repository's main branch (or PRs into it) can
# assume the deploy identity.
#
# The equivalent pool for Terraform Cloud itself is created out-of-band with
# gcloud (bootstrap chicken-and-egg — Terraform can't create its own GCP
# access). See docs/SECRETS_MIGRATION_PLAN.md.
# =============================================================================

resource "google_project_service" "iamcredentials" {
  project = var.gcp_project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false
}

resource "google_iam_workload_identity_pool" "github_actions" {
  project                   = var.gcp_project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "OIDC federation for GitHub Actions CI deploys"
}

resource "google_iam_workload_identity_pool_provider" "github_actions" {
  project                            = var.gcp_project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions-provider"
  display_name                       = "GitHub Actions OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Only this repository may exchange tokens through this provider.
  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Dedicated deploy identity — created and role-scoped entirely by Terraform.
# Replaces both the firebase-adminsdk JSON key and the Firebase-generated
# github-action-* SA previously used by CI.
resource "google_service_account" "github_deploy" {
  project      = var.gcp_project_id
  account_id   = "github-deploy"
  display_name = "GitHub Actions deploy (WIF)"
  description  = "Keyless CI deploy identity for saulpatinojr/SimplySoph-SimplySoph"
}

resource "google_service_account_iam_member" "github_actions_can_impersonate" {
  service_account_id = google_service_account.github_deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_actions.name}/attribute.repository/${var.github_repository}"
}

# ---------------------------------------------------------------------------
# Deploy roles — the exact set a firebase-tools hosting+functions+rules deploy
# needs, learned the hard way (see memory: ci-deploy-identity):
#   - firebasehosting.admin      hosting releases + preview channels
#   - cloudfunctions.developer   create/update functions (+ actAs runtime SA)
#   - firebaserules.admin        firestore.rules + storage.rules releases
#   - firebasestorage.admin      links storage rulesets to the bucket
#   - datastore.indexAdmin       firestore.indexes.json deploys
#   - firebase.viewer            extensions reconciliation during functions
#                                deploy (firebaseextensions.configs.list —
#                                no narrower role carries it)
#   - serviceusage.serviceUsageConsumer  API enablement checks by the CLI
# ---------------------------------------------------------------------------

resource "google_project_iam_member" "github_deploy_roles" {
  for_each = toset([
    "roles/firebasehosting.admin",
    "roles/cloudfunctions.developer",
    "roles/firebaserules.admin",
    "roles/firebasestorage.admin",
    "roles/datastore.indexAdmin",
    "roles/firebase.viewer",
    "roles/serviceusage.serviceUsageConsumer",
  ])

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_deploy.email}"
}

# Functions deploy requires actAs on the runtime service account.
resource "google_service_account_iam_member" "github_can_act_as_firebase_runtime" {
  service_account_id = "projects/${var.gcp_project_id}/serviceAccounts/${local.firebase_runtime_service_account_email}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deploy.email}"
}
