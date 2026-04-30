import type { Finding } from '../../types/findings';
import type { InfraResource } from '../../types/infra';
import { cn } from '../../lib/cn';
import { useInfraStore } from '../../state/useInfraStore';

type FindingsPanelProps = {
  findings: Finding[];
  resources: InfraResource[];
};

export function FindingsPanel({ findings, resources }: FindingsPanelProps) {
  const selectResource = useInfraStore((store) => store.selectResource);
  const byId = new Map(resources.map((resource) => [resource.id, resource]));

  return (
    <section className="min-h-0 overflow-auto border-t border-borderSoft p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Findings</h2>
        <span className="text-xs text-slate-400">{findings.length}</span>
      </div>
      {findings.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No findings detected.</p>
      ) : (
        <div className="space-y-2">
          {findings.map((finding) => (
            <button
              key={finding.id}
              className="w-full rounded-md border border-borderSoft bg-background p-2 text-left hover:bg-panelMuted"
              onClick={() => selectResource(finding.resourceId)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', severityClass(finding.severity))}>
                  {finding.severity}
                </span>
                <span className="truncate text-sm font-medium">{finding.title}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{finding.description}</p>
              {finding.resourceId ? (
                <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{byId.get(finding.resourceId)?.address}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function severityClass(severity: Finding['severity']): string {
  if (severity === 'critical') return 'bg-danger/20 text-red-100';
  if (severity === 'warning') return 'bg-amber/20 text-amber-100';
  return 'bg-slate-600 text-slate-100';
}
