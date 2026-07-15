# =============================================================================
# secrets.tf — Secret catalog and access policy
#
# Terraform owns secret containers, IAM, and secret values. Values are sourced
# from the sensitive `firebase_runtime_secret_values` Terraform Cloud workspace
# variable (HCL map) and pushed into Secret Manager on apply. TFC encrypts
# workspace state at rest and redacts sensitive values from plan output, the
# UI, and logs, so this is the single source of truth for runtime credentials
# instead of pasting values into the GCP console by hand.
#
# Never put any of these in a VITE_* build variable — VITE_* values are baked
# into the public client bundle (see docs/SECRETS_MIGRATION_PLAN.md).
# =============================================================================

locals {
  firebase_runtime_secret_ids = toset([
    "ALGOLIA_APP_ID",
    "ALGOLIA_ADMIN_KEY",
    "ALGOLIA_INDEX_NAME",
    "GEMINI_API_KEY",
    "TIKTOK_ACCESS_TOKEN",
    "INSTAGRAM_ACCESS_TOKEN",
    "UNSUBSCRIBE_TOKEN_SECRET",
    "NEWSLETTER_CONFIRM_TOKEN_SECRET",
  ])

  # 1st-gen Cloud Functions run as the App Engine default service account.
  firebase_runtime_service_account_email = (
    var.firebase_runtime_service_account_email != ""
    ? var.firebase_runtime_service_account_email
    : "${var.gcp_project_id}@appspot.gserviceaccount.com"
  )

  # Only catalog keys with a non-empty value get a Secret Manager version.
  # Everything else stays an empty container until intentionally enabled.
  firebase_runtime_secret_versions = {
    for k, v in var.firebase_runtime_secret_values :
    k => v
    if contains(local.firebase_runtime_secret_ids, k) && v != ""
  }
}

data "google_project" "current" {
  project_id = var.gcp_project_id
}

resource "google_project_service" "secretmanager" {
  project = var.gcp_project_id
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_secret_manager_secret" "firebase_runtime" {
  for_each = local.firebase_runtime_secret_ids

  project   = var.gcp_project_id
  secret_id = each.key

  replication {
    auto {}
  }

  labels = {
    environment = "production"
    managed_by  = "terraform-cloud"
    runtime     = "firebase"
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "firebase_runtime" {
  # Secret names aren't sensitive, only their values are — nonsensitive() here
  # only strips the mark from the for_each key set, not from secret_data below.
  for_each = nonsensitive(toset(keys(local.firebase_runtime_secret_versions)))

  secret      = google_secret_manager_secret.firebase_runtime[each.key].id
  secret_data = local.firebase_runtime_secret_versions[each.key]
}

# Functions runtime reads secret payloads at cold start via defineSecret().
resource "google_secret_manager_secret_iam_member" "firebase_runtime_access" {
  for_each = google_secret_manager_secret.firebase_runtime

  project   = var.gcp_project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${local.firebase_runtime_service_account_email}"
}

# Firebase deploy validates bound secrets by name. The deploy identity only
# needs read-only metadata on each secret — never payloads, never mutation.
resource "google_secret_manager_secret_iam_member" "github_deploy_secret_viewer" {
  for_each = google_secret_manager_secret.firebase_runtime

  project   = var.gcp_project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.viewer"
  member    = "serviceAccount:${google_service_account.github_deploy.email}"
}
