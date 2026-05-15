import type { NodeProps } from '@xyflow/react';
import type { ProviderZoneData } from '../../domain/graph/providerZones';

export function ProviderZoneNode({ data }: NodeProps) {
  const zone = data as unknown as ProviderZoneData;

  return (
    <div className="pointer-events-none h-full w-full rounded-lg border border-accent/35 bg-accent/5 shadow-[inset_0_0_0_1px_rgb(79_179_163_/_0.08)]">
      <div className="flex h-9 items-center gap-2 rounded-t-lg border-b border-accent/20 bg-[#11181c]/90 px-3 text-[11px] text-slate-300">
        <span className="font-mono font-semibold text-slate-100">{zone.account}</span>
        <span className="text-slate-500">/</span>
        <span className="font-mono font-semibold text-slate-100">{zone.region}</span>
        <span className="ml-2 truncate text-slate-500">{zone.provider}</span>
        <span className="ml-auto text-slate-500">{zone.resourceCount}</span>
      </div>
    </div>
  );
}
