import { FileJson, Github, Plus, RefreshCw, RotateCw, Trash2, XCircle } from 'lucide-react';
import { filterPlanChanges, filterPlanEdges } from '../../domain/filtering/filterPlanChanges';
import { trackButtonClick } from '../../analytics/googleAnalytics';
import { useInfraStore } from '../../state/useInfraStore';
import type { PlanAction, PlanResourceChange } from '../../types/plan';
import { PlanChangeDetailsPanel } from './PlanChangeDetailsPanel';
import { PlanFiltersPanel } from './PlanFiltersPanel';
import { PlanGraph } from './PlanGraph';
import { PlanInventory } from './PlanInventory';

export function PlanDashboard() {
  const changes = useInfraStore((store) => store.planChanges);
  const edges = useInfraStore((store) => store.planEdges);
  const filters = useInfraStore((store) => store.planFilters);
  const clear = useInfraStore((store) => store.clear);
  const visibleChanges = filterPlanChanges(changes, filters);
  const visibleEdges = filterPlanEdges(edges, visibleChanges);

  return (
    <main className="grid h-screen grid-rows-[auto_1fr] overflow-hidden bg-background text-slate-100">
      <header className="border-b border-borderSoft bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">InfraSpective</h1>
            <p className="text-xs text-slate-400">
              Plan view. Local browser memory only. Built by{' '}
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
          <button
            className="inline-flex items-center gap-2 rounded-md border border-borderSoft px-3 py-2 text-sm text-slate-200 hover:bg-panelMuted"
            onClick={() => {
              trackButtonClick('clear_plan', { area: 'plan_dashboard' });
              clear();
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear plan
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <SummaryCard icon={<Plus />} label="Add" value={countAction(changes, 'create')} />
          <SummaryCard icon={<RefreshCw />} label="Modify" value={countAction(changes, 'update')} />
          <SummaryCard icon={<XCircle />} label="Delete" value={countAction(changes, 'delete')} danger />
          <SummaryCard icon={<RotateCw />} label="Replace" value={countAction(changes, 'replace')} warn />
          <SummaryCard icon={<FileJson />} label="Read / unchanged" value={countReadUnchanged(changes)} />
          <SummaryCard icon={<FileJson />} label="Total" value={changes.length} />
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-1 gap-0 overflow-auto lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-borderSoft bg-panel">
          <PlanFiltersPanel changes={changes} />
          <PlanInventory changes={visibleChanges} />
        </aside>
        <section className="grid min-h-[700px] grid-rows-[420px_minmax(320px,auto)] lg:min-h-0 lg:grid-rows-[minmax(360px,1fr)_minmax(320px,42vh)]">
          <PlanGraph changes={visibleChanges} edges={visibleEdges} />
          <PlanChangeDetailsPanel changes={changes} />
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  danger,
  warn,
}: {
  icon: React.ReactElement;
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-borderSoft bg-panelMuted px-3 py-2">
      <span className={danger ? 'text-danger' : warn ? 'text-amber' : 'text-accent'}>{icon}</span>
      <div>
        <div className="text-lg font-semibold leading-5">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function countAction(changes: PlanResourceChange[], action: PlanAction): number {
  return changes.filter((change) => change.action === action).length;
}

function countReadUnchanged(changes: PlanResourceChange[]): number {
  return changes.filter((change) => change.action === 'read' || change.action === 'no-op').length;
}
