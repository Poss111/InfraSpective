import type { Finding } from '../../types/findings';
import type { InfraResource } from '../../types/infra';
import { useInfraStore } from '../../state/useInfraStore';

type FiltersPanelProps = {
  resources: InfraResource[];
  findings: Finding[];
};

export function FiltersPanel({ resources, findings }: FiltersPanelProps) {
  const filters = useInfraStore((store) => store.filters);
  const setFilter = useInfraStore((store) => store.setFilter);
  const providers = options(resources.map((resource) => resource.provider).filter(Boolean));
  const types = options(resources.map((resource) => resource.type));
  const modules = options(resources.map((resource) => resource.module ?? '(root)'));
  const severities = options(findings.map((finding) => finding.severity));

  return (
    <div className="border-b border-borderSoft p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <span className="text-xs text-slate-400">{resources.length} total</span>
      </div>
      <input
        className="mb-3 w-full rounded-md border border-borderSoft bg-background px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        placeholder="Search address, name, type, provider"
        value={filters.search}
        onChange={(event) => setFilter('search', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Provider" value={filters.provider} options={providers} onChange={(value) => setFilter('provider', value)} />
        <Select label="Type" value={filters.type} options={types} onChange={(value) => setFilter('type', value)} />
        <Select label="Module" value={filters.module} options={modules} onChange={(value) => setFilter('module', value)} />
        <Select label="Mode" value={filters.mode} options={['managed', 'data']} onChange={(value) => setFilter('mode', value as typeof filters.mode)} />
        <Select label="Severity" value={filters.severity} options={severities} onChange={(value) => setFilter('severity', value as typeof filters.severity)} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={filters.onlyWithFindings}
          onChange={(event) => setFilter('onlyWithFindings', event.target.checked)}
        />
        Only resources with findings
      </label>
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
