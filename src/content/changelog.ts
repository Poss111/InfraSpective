export type ChangelogCategory = 'Added' | 'Improved' | 'Fixed' | 'Security';

export type ChangelogRelease = {
  version: string;
  date: string;
  title: string;
  groups: Array<{
    category: ChangelogCategory;
    items: string[];
  }>;
};

export const changelog: ChangelogRelease[] = [
  {
    version: '0.1.1',
    date: '2026-05-06',
    title: 'Version updates',
    groups: [
      {
        category: 'Added',
        items: [
          'Added a public changelog page for reviewing InfraSpective updates between versions.',
          'Added What\'s new links from the upload screen, state dashboard, and plan dashboard.',
        ],
      },
      {
        category: 'Improved',
        items: ['Documented the release note workflow for future app updates.'],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-06',
    title: 'Initial local-first release',
    groups: [
      {
        category: 'Added',
        items: [
          'Added browser-only Terraform state parsing with resource inventory, dependency graph, details, and findings.',
          'Added Terraform plan JSON parsing with action summaries, change inventory, graph view, and redacted before/after diffs.',
          'Added marketing, privacy, and plan JSON guide pages for the hosted app.',
        ],
      },
      {
        category: 'Security',
        items: [
          'Kept Terraform file contents in browser memory only, with no backend parsing or browser storage persistence.',
          'Redacted sensitive-looking values before showing arbitrary attributes or plan diffs.',
        ],
      },
    ],
  },
];

export const currentAppVersion = changelog[0].version;
