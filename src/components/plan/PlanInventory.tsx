import type { PlanResourceChange } from '../../types/plan';
import { trackButtonClick } from '../../analytics/googleAnalytics';
import { cn } from '../../lib/cn';
import { useInfraStore } from '../../state/useInfraStore';
import { actionBadgeClass } from './PlanNode';

type PlanInventoryProps = {
  changes: PlanResourceChange[];
};

export function PlanInventory({ changes }: PlanInventoryProps) {
  const selectedPlanChangeId = useInfraStore((store) => store.selectedPlanChangeId);
  const selectPlanChange = useInfraStore((store) => store.selectPlanChange);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Changes ({changes.length})
      </div>
      {changes.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-slate-400">No changes match the current filters.</p>
      ) : (
        <div className="space-y-1">
          {changes.map((change) => (
            <button
              key={change.id}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-panelMuted',
                selectedPlanChangeId === change.id ? 'border-accent bg-accent/10' : 'border-transparent bg-transparent',
              )}
              onClick={() => {
                trackButtonClick('select_plan_change', {
                  area: 'plan_inventory',
                  action: change.action,
                  resource_type: change.type,
                  resource_mode: change.mode,
                });
                selectPlanChange(change.id);
              }}
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', actionBadgeClass(change.action))}>
                  {change.action}
                </span>
                <span className="truncate font-mono text-xs text-slate-100">{change.address}</span>
              </div>
              <div className="mt-1 flex gap-2 text-xs text-slate-400">
                <span>{change.mode}</span>
                <span>{change.provider ?? 'unknown provider'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
