# =============================================================================
# outputs.tf — values consumed by GitHub repository variables
#
# Set these two as (non-secret) GitHub repository *variables*:
#   GCP_WORKLOAD_IDENTITY_PROVIDER = workload_identity_provider
#   GCP_SERVICE_ACCOUNT            = github_deploy_service_account
# =============================================================================

output "workload_identity_provider" {
  description = "Full resource name of the GitHub Actions WIF provider (for google-github-actions/auth)"
  value       = google_iam_workload_identity_pool_provider.github_actions.name
}

output "github_deploy_service_account" {
  description = "Email of the keyless CI deploy service account"
  value       = google_service_account.github_deploy.email
}

output "managed_secret_ids" {
  description = "Secret Manager containers managed by this configuration"
  value       = sort(tolist(local.firebase_runtime_secret_ids))
}

output "populated_secret_ids" {
  description = "Catalog keys that currently have a Secret Manager version (names only, never values)"
  # Key names aren't sensitive — nonsensitive() strips the taint inherited
  # from the sensitive values map without exposing any value.
  value = sort(nonsensitive(keys(local.firebase_runtime_secret_versions)))
}
