import { AlertTriangle, Boxes, Filter, GitBranch, Network, Trash2 } from 'lucide-react';
import { filterKnowledgeEntities, filterKnowledgeRelationships } from '../../domain/filtering/filterKnowledgeGraph';
import { useInfraStore } from '../../state/useInfraStore';
import { KnowledgeGraphPanel } from './KnowledgeGraphPanel';

export function KnowledgeDashboard() {
  const graph = useInfraStore((store) => store.knowledgeGraph);
  const filters = useInfraStore((store) => store.knowledgeFilters);
  const setKnowledgeFilter = useInfraStore((store) => store.setKnowledgeFilter);
  const selectedEntityId = useInfraStore((store) => store.selectedKnowledgeEntityId);
  const selectKnowledgeEntity = useInfraStore((store) => store.selectKnowledgeEntity);
  const clear = useInfraStore((store) => store.clear);

  if (!graph) return null;

  const visibleEntities = filterKnowledgeEntities(graph.entities, graph.insights, filters);
  const visibleRelationships = filterKnowledgeRelationships(graph.relationships, visibleEntities);
  const selectedEntity = graph.entities.find((entity) => entity.id === selectedEntityId);
  const selectedInsights = graph.insights.filter((insight) => insight.entityId === selectedEntityId);
  const kinds = unique(graph.entities.map((entity) => entity.kind));
  const providers = unique(graph.entities.map((entity) => entity.provider).filter(Boolean));
  const namespaces = unique(graph.entities.map((entity) => entity.namespace).filter(Boolean));

  return (
    <main className="grid h-screen grid-rows-[auto_1fr] overflow-hidden bg-background text-slate-100">
      <header className="border-b border-borderSoft bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Infrastructure Graph</h1>
            <p className="text-xs text-slate-400">Local-first normalized infrastructure intelligence across uploaded sources.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-borderSoft px-3 py-2 text-sm text-slate-200 hover:bg-panelMuted"
            onClick={clear}
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear graph
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <SummaryCard icon={<Boxes />} label="Entities" value={graph.entities.length} />
          <SummaryCard icon={<GitBranch />} label="Relationships" value={graph.relationships.length} />
          <SummaryCard icon={<Network />} label="Sources" value={graph.sources.length} />
          <SummaryCard icon={<AlertTriangle />} label="Insights" value={graph.insights.length} />
          <SummaryCard icon={<Filter />} label="Visible" value={visibleEntities.length} />
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-1 overflow-auto lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-borderSoft bg-panel">
          <div className="space-y-3 border-b border-borderSoft p-4">
            <input
              className="w-full rounded-md border border-borderSoft bg-background px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              onChange={(event) => setKnowledgeFilter('search', event.target.value)}
              placeholder="Search graph"
              value={filters.search}
            />
            <Select label="Kind" value={filters.kind} options={kinds} onChange={(value) => setKnowledgeFilter('kind', value)} />
            <Select label="Provider" value={filters.provider} options={providers} onChange={(value) => setKnowledgeFilter('provider', value)} />
            <Select label="Namespace" value={filters.namespace} options={namespaces} onChange={(value) => setKnowledgeFilter('namespace', value)} />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                checked={filters.onlyWithInsights}
                onChange={(event) => setKnowledgeFilter('onlyWithInsights', event.target.checked)}
                type="checkbox"
              />
              Only with insights
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <h2 className="mb-3 text-sm font-semibold">Inventory ({visibleEntities.length})</h2>
            <div className="space-y-2">
              {visibleEntities.map((entity) => (
                <button
                  className="w-full rounded-md border border-borderSoft bg-panelMuted p-3 text-left hover:border-accent"
                  key={entity.id}
                  onClick={() => selectKnowledgeEntity(entity.id)}
                  type="button"
                >
                  <div className="truncate text-sm font-semibold text-slate-100">{entity.label}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {entity.kind.replace(/_/g, ' ')}
                    {entity.namespace ? ` / ${entity.namespace}` : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
        <section className="grid min-h-[720px] grid-rows-[minmax(420px,1fr)_minmax(260px,36vh)] lg:min-h-0">
          <KnowledgeGraphPanel entities={visibleEntities} relationships={visibleRelationships} insights={graph.insights} />
          <section className="overflow-auto border-t border-borderSoft bg-panel p-4">
            {selectedEntity ? (
              <div>
                <h2 className="text-base font-semibold">{selectedEntity.label}</h2>
                <div className="mt-2 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <Meta label="Kind" value={selectedEntity.kind.replace(/_/g, ' ')} />
                  <Meta label="Provider" value={selectedEntity.provider ?? 'unknown'} />
                  <Meta label="Namespace" value={selectedEntity.namespace ?? 'none'} />
                  <Meta label="Owner" value={selectedEntity.owner ?? 'missing'} />
                </div>
                <h3 className="mt-4 text-sm font-semibold">Insights</h3>
                <div className="mt-2 space-y-2">
                  {selectedInsights.length ? (
                    selectedInsights.map((insight) => (
                      <div className="rounded-md border border-borderSoft bg-panelMuted p-3 text-sm" key={insight.id}>
                        <div className="font-semibold text-slate-100">{insight.title}</div>
                        <div className="mt-1 text-slate-400">{insight.message}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No insights for this entity.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select an entity to inspect ownership, metadata, and insights.</p>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-borderSoft bg-background px-3 py-2 text-sm text-slate-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactElement; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-borderSoft bg-panelMuted px-3 py-2">
      <span className="text-accent">{icon}</span>
      <div>
        <div className="text-lg font-semibold leading-5">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-borderSoft bg-panelMuted p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm text-slate-200">{value}</div>
    </div>
  );
}

function unique(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort();
}
