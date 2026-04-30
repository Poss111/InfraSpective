import type { Finding } from '../../types/findings';
import type { InfraResource } from '../../types/infra';
import { cn } from '../../lib/cn';
import { useInfraStore } from '../../state/useInfraStore';

type ResourceInventoryProps = {
  resources: InfraResource[];
  findings: Finding[];
};

export function ResourceInventory({ resources, findings }: ResourceInventoryProps) {
  const selectedResourceId = useInfraStore((store) => store.selectedResourceId);
  const selectResource = useInfraStore((store) => store.selectResource);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Inventory ({resources.length})
      </div>
      {resources.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-slate-400">No resources match the current filters.</p>
      ) : (
        <div className="space-y-1">
          {resources.map((resource) => {
            const severity = highestSeverity(findings.filter((finding) => finding.resourceId === resource.id));
            return (
              <button
                key={resource.id}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-panelMuted',
                  selectedResourceId === resource.id ? 'border-accent bg-accent/10' : 'border-transparent bg-transparent',
                )}
                onClick={() => selectResource(resource.id)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', severityClass(severity, resource.mode))} />
                  <span className="truncate font-mono text-xs text-slate-100">{resource.address}</span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-slate-400">
                  <span>{resource.mode}</span>
                  <span>{resource.provider ?? 'unknown provider'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function highestSeverity(findings: Finding[]): Finding['severity'] | undefined {
  if (findings.some((finding) => finding.severity === 'critical')) return 'critical';
  if (findings.some((finding) => finding.severity === 'warning')) return 'warning';
  if (findings.some((finding) => finding.severity === 'info')) return 'info';
  return undefined;
}

function severityClass(severity: Finding['severity'] | undefined, mode: InfraResource['mode']): string {
  if (severity === 'critical') return 'bg-danger';
  if (severity === 'warning') return 'bg-amber';
  if (mode === 'data') return 'bg-sky-400';
  if (severity === 'info') return 'bg-slate-400';
  return 'bg-accent';
}
