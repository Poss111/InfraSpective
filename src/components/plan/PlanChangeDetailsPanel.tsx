import type { PlanResourceChange } from '../../types/plan';
import { useInfraStore } from '../../state/useInfraStore';
import { JsonInspector } from '../details/JsonInspector';
import { actionBadgeClass } from './PlanNode';
import { cn } from '../../lib/cn';

type PlanChangeDetailsPanelProps = {
  changes: PlanResourceChange[];
};

export function PlanChangeDetailsPanel({ changes }: PlanChangeDetailsPanelProps) {
  const selectedPlanChangeId = useInfraStore((store) => store.selectedPlanChangeId);
  const selected = changes.find((change) => change.id === selectedPlanChangeId);

  if (!selected) {
    return (
      <section className="min-h-0 overflow-auto border-t border-borderSoft bg-panel p-4">
        <h2 className="text-sm font-semibold">Selected plan change</h2>
        <p className="mt-8 text-center text-sm text-slate-400">Select a plan node or change row.</p>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-auto border-t border-borderSoft bg-panel p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Selected plan change</h2>
          <p className="mt-2 break-all font-mono text-xs text-accent">{selected.address}</p>
        </div>
        <span className={cn('rounded px-2 py-1 text-xs font-semibold uppercase', actionBadgeClass(selected.action))}>
          {selected.action}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <Field label="Provider" value={selected.provider ?? 'unknown'} />
        <Field label="Type" value={selected.type} />
        <Field label="Mode" value={selected.mode} />
        <Field label="Module" value={selected.module ?? '(root)'} />
      </dl>

      <Section title={`Changed fields (${selected.changedFields.length})`}>
        {selected.changedFields.length === 0 ? (
          <p className="text-sm text-slate-400">No field-level changes to show for this action.</p>
        ) : (
          <div className="overflow-auto rounded-md border border-borderSoft">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead className="bg-background text-slate-400">
                <tr>
                  <th className="border-b border-borderSoft px-3 py-2">Path</th>
                  <th className="border-b border-borderSoft px-3 py-2">Before</th>
                  <th className="border-b border-borderSoft px-3 py-2">After</th>
                </tr>
              </thead>
              <tbody>
                {selected.changedFields.map((field) => (
                  <tr key={field.path} className="border-b border-borderSoft last:border-0">
                    <td className="px-3 py-2 font-mono text-slate-200">{field.path}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{formatValue(field.before)}</td>
                    <td className="px-3 py-2 font-mono text-slate-200">{formatValue(field.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Section title="Before JSON">
          <JsonInspector value={selected.before ?? null} />
        </Section>
        <Section title="After JSON">
          <JsonInspector value={selected.after ?? null} />
        </Section>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-borderSoft bg-background p-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined) return '(unset)';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
