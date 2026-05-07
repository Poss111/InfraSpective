# Agent Context

This document is a handoff brief for agents working on InfraSpective, a local-first Terraform state and plan visualizer.

## Product Summary

InfraSpective parses Terraform state files and Terraform plan JSON entirely in the browser. Users can inspect resources, dependency graphs, proposed plan actions, diffs, and lightweight findings without uploading infrastructure data.

Core product promises to preserve:

- No backend is required for Terraform parsing.
- Uploaded Terraform file contents stay in browser memory.
- File contents are not stored in localStorage or sessionStorage.
- Sensitive-looking values are redacted before display.
- Analytics must never include file names, file contents, resource addresses, raw attributes, diffs, secrets, or other infrastructure-identifying details.
- AdSense is not loaded on `/app`, where users parse Terraform files.

## Tech Stack

- Vite + React 19 + TypeScript.
- Zustand for app state in `src/state/useInfraStore.ts`.
- Tailwind CSS for styling, configured by `tailwind.config.ts` and `src/styles.css`.
- React Flow (`@xyflow/react`) for graph rendering.
- Dagre for graph layout.
- Zod for Terraform state and plan shape validation.
- Vitest + Testing Library + jsdom for tests.
- `react-ga4` for optional Google Analytics.

Useful commands:

```bash
npm run dev
npm test
npm run build
```

## Routing And App Entry

Main entry points:

- `src/main.tsx` mounts the React app.
- `src/app/App.tsx` chooses which screen to render from `window.location.pathname` and store state.
- `src/content/changelog.ts` stores static release notes used by the public changelog route and in-app update links.

Routes currently handled in `App.tsx`:

- `/app`: upload/parser tool.
- `/terraform-state-visualizer`: marketing page for state visualization.
- `/terraform-plan-visualizer`: marketing page for plan visualization.
- `/docs/how-to-generate-terraform-plan-json`: docs-style marketing page.
- `/privacy`: privacy page.
- `/changelog`: public version updates page.
- Any other route: home marketing page.

Important behavior: if the Zustand store has loaded plan changes, `PlanDashboard` renders regardless of route. If it has loaded state resources, `Dashboard` renders regardless of route.

## Data Flow

State upload flow:

1. `StateUploader` reads a selected or dropped JSON file in the browser.
2. It calls `useInfraStore.loadStateJson`.
3. `loadStateJson` calls `parseTerraformState`.
4. `toInfraResources` normalizes Terraform resources and instances into `InfraResource[]`.
5. `buildGraph` creates dependency edges from state instance dependencies.
6. `detectFindings` creates metadata, security, and structure findings.
7. `Dashboard` filters and renders inventory, graph, and details panels.

Plan upload flow:

1. `StateUploader` reads a selected or dropped JSON file in plan mode.
2. It calls `useInfraStore.loadPlanJson`.
3. `loadPlanJson` calls `parseTerraformPlan`.
4. `toPlanResourceChanges` normalizes Terraform `resource_changes`.
5. `detectPlanAction` maps action arrays to `create`, `update`, `delete`, `replace`, `read`, or `no-op`.
6. `diffPlanValues` calculates redacted changed fields for updates and replacements.
7. `buildPlanGraph` currently returns nodes with no edges.
8. `PlanDashboard` filters and renders inventory, graph, and details panels.

## Important Directories

- `src/app`: top-level app routing.
- `src/components/upload`: file selection, drag/drop, demo loading, and upload mode UI.
- `src/components/layout`: state dashboard shell.
- `src/components/plan`: plan dashboard, graph, inventory, filters, details.
- `src/components/graph`: state graph and resource node rendering.
- `src/components/inventory`: state resource list and filters.
- `src/components/details`: selected resource details and JSON inspector.
- `src/components/findings`: findings panel.
- `src/components/marketing`: public marketing/docs/privacy routes.
- `src/content`: static app content such as manually maintained release notes.
- `src/domain/terraform`: schemas, parsing, normalization, plan diffing, address building.
- `src/domain/graph`: state/plan graph construction and Dagre layout.
- `src/domain/findings`: lightweight findings detection.
- `src/domain/filtering`: dashboard filter predicates.
- `src/domain/redaction`: sensitive key detection and recursive redaction.
- `src/domain/resources`: resource type to Lucide icon mapping.
- `src/state`: Zustand store and filter types.
- `src/types`: shared TypeScript domain types.
- `src/tests`: Vitest coverage and fixtures.
- `src/testdata`: bundled demo state and plan JSON imported by the app and tests.
- `public`: static deployment assets, redirects, headers, sitemap, robots, favicon.

## Domain Notes

Terraform state parsing:

- Schema: `src/domain/terraform/terraformStateSchema.ts`.
- Parser: `src/domain/terraform/parseTerraformState.ts`.
- State validation is intentionally permissive with `.passthrough()` but checks for Terraform markers.
- `toInfraResources` handles resources with missing instances by creating one empty instance.
- Resource IDs are based on Terraform addresses. Duplicate addresses get `#2`, `#3`, etc.
- Tags are extracted from `tags`, `tags_all`, and `labels`.
- Provider names are normalized from Terraform provider strings.

Terraform plan parsing:

- Schema: `src/domain/terraform/terraformPlanSchema.ts`.
- Parser: `src/domain/terraform/parseTerraformPlan.ts`.
- Plan validation is permissive with `.passthrough()` but checks for Terraform markers.
- `detectPlanAction` treats any `delete` + `create` pair as `replace`, regardless of order.
- `toPlanResourceChanges` only calculates `changedFields` for `update` and `replace`.
- Plan graph edges are not implemented yet; `buildPlanGraph` returns an empty edge list.

Redaction and diffs:

- Sensitive key detection lives in `src/domain/redaction/redactSensitiveValues.ts`.
- Sensitive key parts include password, passwd, secret, token, key, private, credential, and cert.
- `diffPlanValues` redacts sensitive leaf values and sensitive nested objects before exposing diffs.
- `JsonInspector` and details panels should use redacted values when displaying arbitrary attributes.

Findings:

- `detectFindings` emits three categories: `metadata`, `security`, and `structure`.
- Metadata findings check missing tags, owner/team tags, and env/environment tags on managed resources.
- Security findings check public CIDRs and sensitive-looking keys.
- Structure findings mark data source nodes, isolated managed resources, and high fan-in/fan-out resources.

Graph layout:

- `layoutGraph` uses Dagre with top-to-bottom layout.
- State graph edges come from Terraform state instance dependencies and are only created when both endpoints are parsed resources.
- React Flow node rendering is split between `ResourceNode` and `PlanNode`.

## UI Notes

- The app uses a dark operational dashboard style.
- Main dashboards use a left sidebar for filters/inventory and a right work area for graph plus details.
- `StateUploader` includes both state and plan modes plus demo loaders.
- Avoid introducing backend calls or persistent browser storage for Terraform contents.
- If changing graph layout or node sizing, check both `ResourceGraph` and `PlanGraph`; both use `layoutGraph`.
- If adding filter fields, update the store filter type/defaults, filter panel UI, and filter predicate together.
- If adding plan action types, update `PlanAction`, `detectPlanAction`, plan filters, summary cards, node styling, and tests.

## Analytics And Ads

Analytics:

- Implementation: `src/analytics/googleAnalytics.ts`.
- Disabled unless `VITE_GA_MEASUREMENT_ID` is set.
- Debug logging is enabled by `VITE_ANALYTICS_DEBUG=true`.
- `trackButtonClick` sends a generic `button_click` event with safe parameters.
- Keep analytics payloads aggregate and non-sensitive.
- Changelog/update links may be tracked with aggregate button IDs and safe area names only; do not include resource addresses, file names, or release note text derived from user data.

Ads:

- Implementation: `src/ads/googleAdsense.ts`.
- Disabled unless `VITE_ADSENSE_CLIENT_ID` is set.
- Debug logging is enabled by `VITE_ADSENSE_DEBUG=true`.
- `initAdsense` skips `/app` and may load on marketing/docs/privacy routes.

## Testing Guidance

Existing test coverage focuses on:

- State parsing and resource address construction.
- State graph edge creation.
- Plan parsing, action normalization, and redacted diffs.
- Findings detection.
- App render smoke behavior.
- Redaction behavior.

Add or update tests when touching:

- Terraform parser/schema behavior.
- Resource or plan normalization.
- Redaction or diff logic.
- Finding rules.
- Filter behavior.
- Store orchestration for loaded state/plan.

Primary commands before handoff:

```bash
npm test
npm run build
```

## Known Worktree Context

At the time this document was created, `package.json` and `package-lock.json` already had uncommitted changes related to `react-ga4`. Treat those as existing user/worktree changes unless the user asks otherwise.

## Common Change Recipes

Adding a new Terraform state finding:

1. Update `src/domain/findings/detectFindings.ts`.
2. Extend `src/types/findings.ts` only if the category or severity model changes.
3. Add a focused test in `src/tests/detectFindings.test.ts`.
4. Confirm details/inventory panels still render the finding category and severity cleanly.

Adding support for a new Terraform plan field:

1. Update `src/domain/terraform/terraformPlanSchema.ts` if validation needs to recognize it.
2. Update `src/types/plan.ts` if it becomes part of the normalized app model.
3. Update `toPlanResourceChanges` in `parseTerraformPlan.ts`.
4. Update UI panels under `src/components/plan` as needed.
5. Add tests in `src/tests/parseTerraformPlan.test.ts`.

Changing dashboard filters:

1. Update filter types and defaults in `src/state/useInfraStore.ts`.
2. Update filter UI in `FiltersPanel` or `PlanFiltersPanel`.
3. Update predicates in `filterResources.ts` or `filterPlanChanges.ts`.
4. Add tests if behavior is non-trivial.

Changing file upload behavior:

1. Start in `src/components/upload/StateUploader.tsx`.
2. Preserve local-only parsing and avoid file content persistence.
3. Keep error messages generic and avoid exposing sensitive contents.
4. Ensure demo state and demo plan still load from `src/testdata`.

Adding a new app version update:

1. Add a newest-first release entry in `src/content/changelog.ts`.
2. Keep release notes concise and user-facing, grouped by Added, Improved, Fixed, or Security.
3. Do not include Terraform file names, resource addresses, raw attributes, diffs, secrets, or other user infrastructure-identifying details in release notes.
4. Confirm `/changelog`, the upload screen, and loaded state/plan dashboards still render their update links.
