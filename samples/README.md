# InfraSpective Sample Terraform States

These files are synthetic Terraform state fixtures for testing the web app, CLI, and GitHub Action.

They intentionally use fake IDs, fake account numbers, reserved/example domains, and demo-only secret-looking values. Do not replace these with real Terraform state files unless you are deliberately testing locally and keeping those files out of version control.

Examples:

```bash
infraspective analyze samples/aws-small.tfstate.json --mode state
infraspective analyze samples/multi-cloud.tfstate.json --mode state --format json
infraspective analyze samples/edge-cases.tfstate.json --mode state --fail-on warning
```
