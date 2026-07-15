# =============================================================================
# backend.tf — HCP Terraform Cloud remote state
# Org: SimplySoph | Workspace: SimplySoph (dedicated TFC account — separate
# from any other project's TFC org)
# TFC working directory MUST be set to: platform/terraform
# (Settings → General → Terraform Working Directory)
# =============================================================================
terraform {
  cloud {
    organization = "SimplySoph"
    workspaces {
      name = "SimplySoph"
    }
  }
}
