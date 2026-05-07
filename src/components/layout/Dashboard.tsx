import { AlertTriangle, Database, FileOutput, Github, Network, Newspaper, ShieldAlert, Trash2 } from 'lucide-react';
import { filterEdges, filterResources } from '../../domain/filtering/filterResources';
import { useInfraStore } from '../../state/useInfraStore';
import { trackButtonClick } from '../../analytics/googleAnalytics';
import { currentAppVersion } from '../../content/changelog';
import { ResourceGraph } from '../graph/ResourceGraph';
import { ResourceDetailsPanel } from '../details/ResourceDetailsPanel';
import { ResourceInventory } from '../inventory/ResourceInventory';
import { FiltersPanel } from '../inventory/FiltersPanel';

export function Dashboard() {
  const state = useInfraStore((store) => store.state);
  const resources = useInfraStore((store) => store.resources);
  const edges = useInfraStore((store) => store.edges);
  const findings = useInfraStore((store) => store.findings);
  const filters = useInfraStore((store) => store.filters);
  const clear = useInfraStore((store) => store.clear);

  const visibleResources = filterResources(resources, findings, filters);
  const visibleEdges = filterEdges(edges, visibleResources);
  const providers = new Set(resources.map((resource) => resource.provider).filter(Boolean)).size;
  const modules = new Set(resources.map((resource) => resource.module).filter(Boolean)).size;
  const outputs = Object.keys(state?.outputs ?? {}).length;

  return (
    <main className="grid h-screen grid-rows-[auto_1fr] overflow-hidden bg-background text-slate-100">
      <header className="border-b border-borderSoft bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">InfraSpective</h1>
            <p className="text-xs text-slate-400">
              Snapshot view. Local browser memory only. Built by{' '}
              <a
                className="inline-flex items-center gap-1 text-accent hover:underline"
                href="https://github.com/Poss111"
                rel="noreferrer"
                target="_blank"
              >
                <Github className="h-3.5 w-3.5" aria-hidden />
                Poss111
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              className="inline-flex items-center gap-2 rounded-md border border-borderSoft px-3 py-2 text-sm text-slate-200 hover:bg-panelMuted"
              href="/changelog"
              onClick={() => trackButtonClick('open_changelog', { area: 'state_dashboard' })}
            >
              <Newspaper className="h-4 w-4" aria-hidden />
              What's new
              <span className="text-xs text-slate-500">{currentAppVersion}</span>
            </a>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-borderSoft px-3 py-2 text-sm text-slate-200 hover:bg-panelMuted"
              onClick={() => {
                trackButtonClick('clear_state', { area: 'state_dashboard' });
                clear();
              }}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Clear state
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <SummaryCard icon={<Database />} label="Resources" value={resources.length} />
          <SummaryCard icon={<Network />} label="Providers" value={providers} />
          <SummaryCard icon={<Database />} label="Modules" value={modules} />
          <SummaryCard icon={<FileOutput />} label="Outputs" value={outputs} />
          <SummaryCard icon={<ShieldAlert />} label="Findings" value={findings.length} critical={findings.some((f) => f.severity === 'critical')} />
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-1 gap-0 overflow-auto lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-borderSoft bg-panel">
          <FiltersPanel resources={resources} findings={findings} />
          <ResourceInventory resources={visibleResources} findings={findings} />
        </aside>
        <section className="grid min-h-[700px] grid-rows-[420px_minmax(320px,auto)] lg:min-h-0 lg:grid-rows-[minmax(360px,1fr)_minmax(320px,42vh)]">
          <ResourceGraph resources={visibleResources} edges={visibleEdges} findings={findings} />
          <ResourceDetailsPanel resources={resources} findings={findings} />
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  critical,
}: {
  icon: React.ReactElement;
  label: string;
  value: number;
  critical?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-borderSoft bg-panelMuted px-3 py-2">
      <span className={critical ? 'text-danger' : 'text-accent'}>{icon}</span>
      <div>
        <div className="text-lg font-semibold leading-5">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
      {critical ? <AlertTriangle className="ml-auto h-4 w-4 text-danger" aria-hidden /> : null}
    </div>
  );
}
