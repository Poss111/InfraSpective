import type { PlanResourceChange } from '../../types/plan';
import { useInfraStore } from '../../state/useInfraStore';

type PlanFiltersPanelProps = {
  changes: PlanResourceChange[];
};

export function PlanFiltersPanel({ changes }: PlanFiltersPanelProps) {
  const filters = useInfraStore((store) => store.planFilters);
  const setPlanFilter = useInfraStore((store) => store.setPlanFilter);
  const actions = options(changes.map((change) => change.action));
  const providers = options(changes.map((change) => change.provider).filter(Boolean));
  const types = options(changes.map((change) => change.type));
  const modules = options(changes.map((change) => change.module ?? '(root)'));

  return (
    <div className="border-b border-borderSoft p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Plan filters</h2>
        <span className="text-xs text-slate-400">{changes.length} total</span>
      </div>
      <input
        className="mb-3 w-full rounded-md border border-borderSoft bg-background px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        placeholder="Search address, type, provider, action"
        value={filters.search}
        onChange={(event) => setPlanFilter('search', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Action" value={filters.action} options={actions} onChange={(value) => setPlanFilter('action', value as typeof filters.action)} />
        <Select label="Provider" value={filters.provider} options={providers} onChange={(value) => setPlanFilter('provider', value)} />
        <Select label="Type" value={filters.type} options={types} onChange={(value) => setPlanFilter('type', value)} />
        <Select label="Module" value={filters.module} options={modules} onChange={(value) => setPlanFilter('module', value)} />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options: selectOptions,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-slate-400">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-borderSoft bg-background px-2 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">All</option>
        {selectOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function options(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}
