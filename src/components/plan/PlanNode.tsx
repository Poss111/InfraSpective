import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import type { PlanResourceChange } from '../../types/plan';
import { getResourceIcon } from '../../domain/resources/getResourceIcon';
import { cn } from '../../lib/cn';

export type PlanNodeData = {
  change: PlanResourceChange;
  selected: boolean;
};

export function PlanNode({ data }: NodeProps) {
  const nodeData = data as unknown as PlanNodeData;
  const change = nodeData.change;
  const Icon = getResourceIcon(change);

  return (
    <div
      className={cn(
        'w-[270px] rounded-md border bg-panel p-3 shadow-lg',
        nodeData.selected ? 'ring-2 ring-accent/30' : '',
        actionBorder(change.action),
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-borderSoft" />
      <div className="flex items-center gap-2">
        <span className={cn('rounded p-1', actionIconClass(change.action))}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="truncate font-mono text-xs font-semibold text-slate-100">{change.address}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">
            {change.mode} / {change.provider ?? 'unknown'}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', actionBadgeClass(change.action))}>
          {change.action}
        </span>
        <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">{change.type}</span>
        {change.changedFields.length ? (
          <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">
            {change.changedFields.length} fields
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-borderSoft" />
    </div>
  );
}

export function actionBadgeClass(action: PlanResourceChange['action']): string {
  if (action === 'create') return 'bg-accent/20 text-emerald-100';
  if (action === 'update') return 'bg-amber/20 text-amber-100';
  if (action === 'delete') return 'bg-danger/20 text-red-100';
  if (action === 'replace') return 'bg-fuchsia-500/20 text-fuchsia-100';
  if (action === 'read') return 'bg-sky-500/20 text-sky-100';
  return 'bg-slate-600 text-slate-100';
}

function actionIconClass(action: PlanResourceChange['action']): string {
  if (action === 'create') return 'bg-accent/20 text-accent';
  if (action === 'update') return 'bg-amber/20 text-amber-100';
  if (action === 'delete') return 'bg-danger/20 text-red-100';
  if (action === 'replace') return 'bg-fuchsia-500/20 text-fuchsia-100';
  if (action === 'read') return 'bg-sky-500/20 text-sky-100';
  return 'bg-slate-600 text-slate-100';
}

function actionBorder(action: PlanResourceChange['action']): string {
  if (action === 'create') return 'border-accent';
  if (action === 'update') return 'border-amber';
  if (action === 'delete') return 'border-danger';
  if (action === 'replace') return 'border-fuchsia-400';
  if (action === 'read') return 'border-sky-400';
  return 'border-borderSoft';
}
