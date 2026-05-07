import { ArrowRight, CalendarDays, FileJson, Github, LockKeyhole, Network, ShieldCheck, Upload, WifiOff } from 'lucide-react';
import type { PlanAction } from '../../types/plan';
import { actionBadgeClass } from '../plan/PlanNode';
import { cn } from '../../lib/cn';
import { trackButtonClick, trackEvent } from '../../analytics/googleAnalytics';
import { changelog } from '../../content/changelog';

type MarketingPage =
  | 'home'
  | 'state'
  | 'plan'
  | 'plan-json'
  | 'privacy'
  | 'changelog';

type MarketingPagesProps = {
  page: MarketingPage;
};

export function MarketingPages({ page }: MarketingPagesProps) {
  if (page === 'state') return <StateVisualizerPage />;
  if (page === 'plan') return <PlanVisualizerPage />;
  if (page === 'plan-json') return <PlanJsonGuidePage />;
  if (page === 'privacy') return <PrivacyPage />;
  if (page === 'changelog') return <ChangelogPage />;
  return <HomePage />;
}

function HomePage() {
  return (
    <MarketingShell>
      <section className="grid items-center gap-10 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <Pill>Local-first Terraform inspection</Pill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-normal text-slate-50 sm:text-6xl">
            Visualize Terraform state and plan changes without uploading sensitive files.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            InfraSpective maps Terraform state files and plan JSON in your browser so you can inspect resources,
            dependencies, creates, updates, deletes, replacements, and findings before anything leaves your machine.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/app">Open the tool</PrimaryLink>
            <SecondaryLink href="/docs/how-to-generate-terraform-plan-json">Generate plan JSON</SecondaryLink>
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        <Feature icon={<WifiOff />} title="No uploads" body="State and plan files are parsed inside the browser session, not sent to a server." />
        <Feature icon={<LockKeyhole />} title="Secret-aware" body="Sensitive-looking values are redacted before they appear in details and diffs." />
        <Feature icon={<Network />} title="Graph-first" body="Explore resources and plan actions as a visual map instead of scanning long JSON output." />
      </section>
    </MarketingShell>
  );
}

function StateVisualizerPage() {
  return (
    <MarketingShell>
      <Article
        eyebrow="Terraform state visualizer"
        title="Understand what Terraform believes exists."
        intro="Upload a terraform.tfstate JSON file and InfraSpective turns it into a searchable resource inventory, dependency graph, selected-resource details, and basic local findings."
      >
        <Section title="What it helps with">
          <p>
            Terraform state files are dense and can contain sensitive values. InfraSpective gives platform engineers a
            local way to inspect resources, modules, providers, outputs, dependencies, tags, and raw attributes with
            redaction.
          </p>
        </Section>
        <Section title="Search targets">
          <KeywordList items={['terraform state visualizer', 'visualize terraform state', 'terraform tfstate viewer', 'local terraform state viewer']} />
        </Section>
        <PrimaryLink href="/app">Open the state visualizer</PrimaryLink>
      </Article>
    </MarketingShell>
  );
}

function PlanVisualizerPage() {
  return (
    <MarketingShell>
      <Article
        eyebrow="Terraform plan visualizer"
        title="See creates, updates, deletes, and replacements before apply."
        intro="InfraSpective parses Terraform plan JSON from terraform show -json and highlights proposed infrastructure changes in a local browser graph."
      >
        <Section title="What it shows">
          <p>
            The plan view summarizes add, modify, delete, replace, read, and unchanged actions, then lets you select a
            resource to inspect changed fields with before and after values.
          </p>
        </Section>
        <Section title="Search targets">
          <KeywordList items={['terraform plan visualizer', 'terraform plan diff viewer', 'terraform show json viewer', 'visualize terraform plan']} />
        </Section>
        <PrimaryLink href="/app">Open the plan visualizer</PrimaryLink>
      </Article>
    </MarketingShell>
  );
}

function PlanJsonGuidePage() {
  return (
    <MarketingShell>
      <Article
        eyebrow="Guide"
        title="How to generate Terraform plan JSON."
        intro="InfraSpective supports JSON output from Terraform plans. Binary .tfplan files must be converted locally before uploading them to the browser app."
      >
        <Section title="Commands">
          <pre className="overflow-auto rounded-md border border-borderSoft bg-background p-4 font-mono text-sm leading-6 text-slate-200">
            terraform plan -out=plan.out{'\n'}terraform show -json plan.out &gt; plan.json
          </pre>
        </Section>
        <Section title="Why JSON">
          <p>
            Terraform binary plan files are not browser-readable. The JSON form exposes structured resource changes,
            action arrays, before values, after values, and unknown-after markers that InfraSpective can safely parse
            without running Terraform.
          </p>
        </Section>
        <PrimaryLink href="/app">Open InfraSpective</PrimaryLink>
      </Article>
    </MarketingShell>
  );
}

function PrivacyPage() {
  return (
    <MarketingShell>
      <Article
        eyebrow="Privacy"
        title="InfraSpective is designed around local-only file handling."
        intro="The hosted site serves the application code. Terraform state and plan contents are parsed in browser memory and are not uploaded, persisted, or transmitted by the app."
      >
        <Section title="Local-only behavior">
          <p>
            InfraSpective does not use a backend for file parsing. It does not store Terraform state or plan content in
            localStorage or sessionStorage. Clearing the loaded file removes the parsed data from app state.
          </p>
        </Section>
        <Section title="Sensitive data">
          <p>
            Terraform files may contain secrets, IDs, IP addresses, IAM policies, and topology. InfraSpective redacts
            sensitive-looking keys such as passwords, tokens, private keys, credentials, and certificates in the UI.
          </p>
        </Section>
        <Section title="Usage analytics">
          <p>
            If Google Analytics is configured for the hosted site, InfraSpective may collect page views and high-level
            interaction events such as switching upload modes, loading a demo, parsing success, parsing errors, and
            aggregate resource or plan-change counts. InfraSpective does not send Terraform file names, file contents,
            raw attributes, resource addresses, diffs, secrets, or selected resource details to analytics.
          </p>
        </Section>
        <Section title="Advertising">
          <p>
            If Google AdSense is configured, ads may be shown on public marketing and documentation pages. The AdSense
            script is not loaded on the `/app` tool route where Terraform state and plan files are parsed.
          </p>
        </Section>
      </Article>
    </MarketingShell>
  );
}

function ChangelogPage() {
  return (
    <MarketingShell>
      <Article
        eyebrow="Changelog"
        title="What changed in InfraSpective."
        intro="Follow app updates by version, including new visualization capabilities, usability improvements, fixes, and security-relevant changes."
      >
        <div className="space-y-5">
          {changelog.map((release) => (
            <section key={release.version} className="rounded-md border border-borderSoft bg-panel/85 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-borderSoft pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    {release.version}: {release.title}
                  </h2>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-400">
                    <CalendarDays className="h-4 w-4 text-accent" aria-hidden />
                    <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {release.groups.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">{group.category}</h3>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                      {group.items.map((item) => (
                        <li key={item} className="border-l border-borderSoft pl-3">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Article>
    </MarketingShell>
  );
}

function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-slate-100">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#334049_1px,transparent_1px),linear-gradient(90deg,#334049_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto max-w-7xl px-5 py-5 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <a className="text-lg font-semibold text-slate-50" href="/">
            InfraSpective
          </a>
          <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <a className="hover:text-accent" href="/terraform-state-visualizer">State</a>
            <a className="hover:text-accent" href="/terraform-plan-visualizer">Plan</a>
            <a className="hover:text-accent" href="/changelog">Changelog</a>
            <a className="hover:text-accent" href="/privacy">Privacy</a>
            <a className="inline-flex items-center gap-1 hover:text-accent" href="https://github.com/Poss111" rel="noreferrer" target="_blank">
              <Github className="h-4 w-4" aria-hidden />
              Poss111
            </a>
          </nav>
          <a className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-slate-950" href="/app">
            Open app
          </a>
        </header>
        {children}
      </div>
    </main>
  );
}

function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function Article({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-4xl py-16">
      <Pill>{eyebrow}</Pill>
      <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-50 sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-300">{intro}</p>
      <div className="mt-10 space-y-8 text-slate-300">{children}</div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-slate-100">{title}</h2>
      <div className="leading-7">{children}</div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-lg border border-borderSoft bg-panel p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between border-b border-borderSoft pb-3">
        <div>
          <div className="text-sm font-semibold">Local plan diff</div>
          <div className="text-xs text-slate-400">Browser memory only</div>
        </div>
        <ShieldCheck className="h-5 w-5 text-accent" aria-hidden />
      </div>
      <div className="grid gap-3">
        {[
          { action: 'create', address: 'module.network.aws_subnet.public[2]', type: 'aws_subnet' },
          { action: 'update', address: 'module.app.aws_instance.app[0]', type: 'aws_instance' },
          { action: 'delete', address: 'aws_s3_bucket.logs', type: 'aws_s3_bucket' },
          { action: 'replace', address: 'module.network.aws_security_group.web', type: 'aws_security_group' },
        ].map(({ action, address, type }) => (
          <div key={address} className="rounded-md border border-borderSoft bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-mono text-xs text-slate-200">{address}</span>
              <span className={cn('rounded px-2 py-1 text-[10px] font-semibold uppercase', actionBadgeClass(action as PlanAction))}>
                {action}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">{type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactElement; title: string; body: string }) {
  return (
    <div className="rounded-md border border-borderSoft bg-panel/85 p-4">
      <div className="mb-3 text-accent">{icon}</div>
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-accent">
      <ShieldCheck className="h-4 w-4" aria-hidden />
      {children}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950"
      href={href}
      onClick={() => {
        trackButtonClick('marketing_primary_cta', { area: 'marketing', target: href });
        trackEvent('marketing_cta_click', { target: href });
      }}
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </a>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-md border border-borderSoft px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-panel"
      href={href}
      onClick={() => {
        trackButtonClick('marketing_secondary_cta', { area: 'marketing', target: href });
        trackEvent('marketing_cta_click', { target: href });
      }}
    >
      {children}
    </a>
  );
}

function KeywordList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-borderSoft bg-panel px-3 py-2 text-sm text-slate-300">
          {item}
        </li>
      ))}
    </ul>
  );
}
