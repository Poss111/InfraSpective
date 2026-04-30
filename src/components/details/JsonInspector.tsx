import { redactSensitiveValues } from '../../domain/redaction/redactSensitiveValues';

type JsonInspectorProps = {
  value: unknown;
};

export function JsonInspector({ value }: JsonInspectorProps) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md border border-borderSoft bg-background p-3 font-mono text-xs leading-5 text-slate-300">
      {JSON.stringify(redactSensitiveValues(value), null, 2)}
    </pre>
  );
}
