import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import type { Finding } from '../../types/findings';
import type { InfraResource } from '../../types/infra';
import { getResourceIcon } from '../../domain/resources/getResourceIcon';
import { cn } from '../../lib/cn';

export type ResourceNodeData = Record<string, unknown> & {
  resource: InfraResource;
  findings: Finding[];
  selected: boolean;
};

export function ResourceNode({ data }: NodeProps) {
  const nodeData = data as unknown as ResourceNodeData;
  const severity = highestSeverity(nodeData.findings);
  const resource = nodeData.resource;
  const Icon = getResourceIcon(resource);

  return (
    <div
      className={cn(
        'w-[250px] rounded-md border bg-panel p-3 shadow-lg',
        nodeData.selected ? 'border-accent ring-2 ring-accent/30' : 'border-borderSoft',
        severity === 'critical' && 'border-danger',
        severity === 'warning' && 'border-amber',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-borderSoft" />
      <div className="flex items-center gap-2">
        <span className={cn('rounded p-1', iconClass(severity, resource.mode))}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="truncate font-mono text-xs font-semibold text-slate-100">{resource.address}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">
            {resource.mode} / {resource.provider ?? 'unknown'}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">{resource.type}</span>
        {nodeData.findings.length ? (
          <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">
            {nodeData.findings.length} findings
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-borderSoft" />
    </div>
  );
}

function highestSeverity(findings: Finding[]): Finding['severity'] | undefined {
  if (findings.some((finding) => finding.severity === 'critical')) return 'critical';
  if (findings.some((finding) => finding.severity === 'warning')) return 'warning';
  if (findings.some((finding) => finding.severity === 'info')) return 'info';
  return undefined;
}

function iconClass(severity: Finding['severity'] | undefined, mode: InfraResource['mode']): string {
  if (severity === 'critical') return 'bg-danger/20 text-red-100';
  if (severity === 'warning') return 'bg-amber/20 text-amber-100';
  if (mode === 'data') return 'bg-sky-500/20 text-sky-100';
  return 'bg-accent/20 text-accent';
}
