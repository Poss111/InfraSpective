# InfraSpective

InfraSpective is a local-first Terraform state and plan visualizer.

It parses Terraform state files and Terraform plan JSON in the browser so users
can inspect resources, dependencies, proposed creates, updates, deletes,
replacements, and findings without uploading sensitive files.

## Local-First Promise

- No backend is required for file parsing.
- Terraform state and plan contents are not uploaded by the app.
- File contents are not stored in localStorage or sessionStorage.
- Sensitive-looking values are redacted in the UI.

## Development

```bash
npm install
npm run dev
```

## Analytics

Google Analytics is disabled unless a GA4 measurement ID is provided.

For local development or hosted deployment, set:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

InfraSpective only tracks page views and high-level interaction events. It does
not send Terraform file names, file contents, resource addresses, raw
attributes, diffs, or secrets to analytics.

## Checks

```bash
npm test
npm run build
```

## License

InfraSpective is source-available under the
[InfraSpective Source Available License](./LICENSE).

You may view, run, and modify InfraSpective locally for personal use,
educational use, evaluation, and internal non-commercial use.

Commercial redistribution, hosted service offerings, paid product integration,
white-label use, and team or enterprise use require a separate commercial
license from Poss111.

Third-party open source dependencies are listed in
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) and remain licensed under
their own terms.
