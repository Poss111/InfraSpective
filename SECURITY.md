# Security Policy

## Supported Versions

InfraSpective is early-stage software. Security reports should target the
current `main` branch unless release branches are introduced later.

## Reporting a Vulnerability

Please report security issues privately through GitHub:

https://github.com/Poss111

If the repository has GitHub Security Advisories enabled, use a private
security advisory. Otherwise, contact the maintainer through the GitHub profile
above and avoid opening a public issue for sensitive reports.

## Sensitive Terraform Files

Terraform state and plan files can contain secrets, credentials, account IDs,
network topology, IAM policies, and other sensitive infrastructure details.

Do not attach real Terraform state or plan files to public issues, pull
requests, discussions, screenshots, or bug reports. Use sanitized examples or
the bundled demo fixtures instead.

## Local-Only Design

InfraSpective is designed to parse uploaded Terraform state and plan JSON in
browser memory. The app should not upload, persist, or transmit state or plan
contents.

Security-sensitive changes should preserve this local-only behavior unless a
future feature explicitly documents a different data flow.
