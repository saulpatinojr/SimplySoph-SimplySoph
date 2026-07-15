# =============================================================================
# variables.tf — SimplySoph secrets & deploy-identity infrastructure
# Sensitive values are set as workspace variables in HCP Terraform Cloud
# Org: hcw | Workspace: SimplySoph
#
# Variable names here MUST match TFC workspace variable keys exactly.
# =============================================================================

variable "gcp_project_id" {
  description = "GCP project that hosts Firebase and Secret Manager runtime secrets"
  type        = string
  default     = "simplysoph-66c78"
}

variable "gcp_region" {
  description = "Default GCP region for Firebase and Secret Manager resources"
  type        = string
  default     = "us-central1"
}

variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to assume the deploy identity via OIDC"
  type        = string
  default     = "saulpatinojr/SimplySoph-SimplySoph"
}

variable "terraform_run_service_account_email" {
  description = "HCP Terraform dynamic-credentials service account that owns Terraform-managed IAM resources (created out-of-band during bootstrap)"
  type        = string
  default     = "terraform-cloud-deploy@simplysoph-66c78.iam.gserviceaccount.com"
}

variable "firebase_runtime_service_account_email" {
  description = "Firebase Functions runtime service account. Empty uses the App Engine default service account (1st-gen functions run as appspot)."
  type        = string
  default     = ""
}

variable "firebase_runtime_secret_values" {
  description = "Map of runtime secret name -> value, sourced from a sensitive HCL-map TFC workspace variable. Only keys present here (and non-empty) get a Secret Manager version; unset keys stay empty containers until their integration is rotated and enabled."
  type        = map(string)
  default     = {}
  sensitive   = true
}
