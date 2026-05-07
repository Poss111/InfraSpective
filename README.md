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

Google Analytics is implemented with `react-ga4` and disabled unless a GA4 measurement ID is provided.

For local development or hosted deployment, set:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

InfraSpective only tracks page views and high-level interaction events. It does
not send Terraform file names, file contents, resource addresses, raw
attributes, diffs, or secrets to analytics.

Button interactions are tracked with the GA event name `button_click` and safe
parameters such as `button_id`, `area`, `upload_mode`, `action`, and resource
type/mode. The app intentionally avoids sending resource addresses or file
details.

For deployment debugging, temporarily set:

```bash
VITE_ANALYTICS_DEBUG=true
```

Then redeploy and check the browser console for `[InfraSpective analytics]`
messages. Turn it back off after confirming events are being sent.

## Ads

Google AdSense is disabled unless an AdSense publisher client ID is provided.

For hosted deployment, set:

```bash
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

The AdSense script is loaded only on public marketing and documentation routes.
It is intentionally not loaded on `/app`, where users parse Terraform state and
plan files.

For deployment debugging, temporarily set:

```bash
VITE_ADSENSE_DEBUG=true
```

Then redeploy and check the browser console for `[InfraSpective adsense]`
messages. Turn it back off after confirming the script is loading.

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
