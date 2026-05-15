import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Boxes, Box, Database, GitBranch, KeyRound, Layers, Network, Package, Shield, Users } from 'lucide-react';
import type { KnowledgeEntity, KnowledgeInsight } from '../../types/knowledge';
import { cn } from '../../lib/cn';

export type KnowledgeNodeData = {
  entity: KnowledgeEntity;
  insights: KnowledgeInsight[];
  selected: boolean;
};

export function KnowledgeNode({ data }: NodeProps) {
  const nodeData = data as unknown as KnowledgeNodeData;
  const entity = nodeData.entity;
  const Icon = iconFor(entity.kind);
  const hasWarning = nodeData.insights.some((insight) => insight.severity === 'warning' || insight.severity === 'critical');

  return (
    <div
      className={cn(
        'w-[250px] rounded-md border bg-panel p-3 shadow-lg',
        nodeData.selected ? 'border-accent ring-2 ring-accent/30' : 'border-borderSoft',
        hasWarning && 'border-amber',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-borderSoft" />
      <div className="flex items-center gap-2">
        <span className={cn('rounded p-1', hasWarning ? 'bg-amber/20 text-amber-100' : 'bg-accent/20 text-accent')}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-slate-100">{entity.label}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">
            {entity.kind.replace(/_/g, ' ')} / {entity.provider ?? 'unknown'}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {entity.namespace ? <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">{entity.namespace}</span> : null}
        {entity.owner ? <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">{entity.owner}</span> : null}
        {nodeData.insights.length ? (
          <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-slate-300">{nodeData.insights.length} insights</span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-borderSoft" />
    </div>
  );
}

function iconFor(kind: KnowledgeEntity['kind']) {
  if (kind === 'team') return Users;
  if (kind === 'namespace' || kind === 'cluster') return Network;
  if (kind === 'workload' || kind === 'service' || kind === 'application') return Boxes;
  if (kind === 'database') return Database;
  if (kind === 'secret') return KeyRound;
  if (kind === 'terraform_change') return GitBranch;
  if (kind === 'helm_release' || kind === 'helm_chart') return Package;
  if (kind === 'api') return Shield;
  if (kind === 'kubernetes_resource') return Layers;
  return Box;
}
