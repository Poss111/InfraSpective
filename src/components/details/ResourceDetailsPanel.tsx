import type { Finding } from '../../types/findings';
import type { InfraResource } from '../../types/infra';
import { useInfraStore } from '../../state/useInfraStore';
import { JsonInspector } from './JsonInspector';

type ResourceDetailsPanelProps = {
  resources: InfraResource[];
  findings: Finding[];
};

export function ResourceDetailsPanel({ resources, findings }: ResourceDetailsPanelProps) {
  const selectedResourceId = useInfraStore((store) => store.selectedResourceId);
  const selected = resources.find((resource) => resource.id === selectedResourceId);
  const selectedFindings = findings.filter((finding) => finding.resourceId === selected?.id);

  if (!selected) {
    return (
      <section className="min-h-0 overflow-auto border-t border-borderSoft bg-panel p-4">
        <h2 className="text-sm font-semibold">Selected configuration</h2>
        <p className="mt-8 text-center text-sm text-slate-400">Select a graph node or inventory row.</p>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-auto border-t border-borderSoft bg-panel p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Selected configuration</h2>
        <p className="mt-2 break-all font-mono text-xs text-accent">{selected.address}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Mode" value={selected.mode} />
        <Field label="Provider" value={selected.provider ?? 'unknown'} />
        <Field label="Type" value={selected.type} />
        <Field label="Name" value={selected.name} />
        <Field label="Module" value={selected.module ?? '(root)'} />
        <Field label="Instance" value={selected.indexKey === undefined ? '-' : String(selected.indexKey)} />
      </dl>

      <Section title={`Findings (${selectedFindings.length})`}>
        {selectedFindings.length === 0 ? (
          <p className="text-sm text-slate-400">No findings for this resource.</p>
        ) : (
          <ul className="space-y-2">
            {selectedFindings.map((finding) => (
              <li key={finding.id} className="rounded-md border border-borderSoft bg-background p-2">
                <div className="text-sm font-medium">{finding.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{finding.description}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Dependencies">
        {selected.dependencies.length === 0 ? (
          <p className="text-sm text-slate-400">No explicit dependencies in state.</p>
        ) : (
          <ul className="space-y-1">
            {selected.dependencies.map((dependency) => (
              <li key={dependency} className="break-all font-mono text-xs text-slate-300">
                {dependency}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Tags">
        {Object.keys(selected.tags).length === 0 ? (
          <p className="text-sm text-slate-400">No tags detected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(selected.tags).map(([key, value]) => (
              <span key={key} className="rounded border border-borderSoft bg-background px-2 py-1 text-xs">
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Raw attributes">
        <JsonInspector value={selected.attributes} />
      </Section>
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
