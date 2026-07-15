# =============================================================================
# backend.tf — HCP Terraform Cloud remote state
# Org: hcw | Workspace: SimplySoph
# TFC working directory MUST be set to: platform/terraform
# (Settings → General → Terraform Working Directory)
# =============================================================================
terraform {
  cloud {
    organization = "hcw"
    workspaces {
      name = "SimplySoph"
    }
  }
}
