import { useMemo } from 'react';
import {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { Finding } from '../../types/findings';
import type { InfraEdge, InfraResource } from '../../types/infra';
import { layoutGraph } from '../../domain/graph/layoutGraph';
import { buildStateSafeExport, countBucket } from '../../domain/export/safeExport';
import { copySafeExportText, exportSafePng } from '../../domain/export/safeExportBrowser';
import { trackButtonClick } from '../../analytics/googleAnalytics';
import { useInfraStore } from '../../state/useInfraStore';
import { buildProviderZoneNodes, type ProviderZoneData } from '../../domain/graph/providerZones';
import { ProviderZoneNode } from './ProviderZoneNode';
import { ResourceNode, type ResourceNodeData } from './ResourceNode';

const nodeTypes = { providerZone: ProviderZoneNode, resource: ResourceNode };

type ResourceGraphProps = {
  resources: InfraResource[];
  edges: InfraEdge[];
  findings: Finding[];
};

export function ResourceGraph(props: ResourceGraphProps) {
  return (
    <ReactFlowProvider>
      <ResourceGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function ResourceGraphInner({ resources, edges, findings }: ResourceGraphProps) {
  const selectedResourceId = useInfraStore((store) => store.selectedResourceId);
  const selectResource = useInfraStore((store) => store.selectResource);
  const { fitView } = useReactFlow();
  const safeExport = useMemo(() => buildStateSafeExport(resources, edges, findings), [edges, findings, resources]);

  const graph = useMemo(() => {
    const connectedIds = new Set(
      edges.flatMap((edge) => (edge.source === selectedResourceId || edge.target === selectedResourceId ? [edge.source, edge.target] : [])),
    );

    const resourceNodes: Node<ResourceNodeData>[] = resources.map((resource) => ({
      id: resource.id,
      type: 'resource',
      position: { x: 0, y: 0 },
      zIndex: 1,
      data: {
        resource,
        findings: findings.filter((finding) => finding.resourceId === resource.id),
        selected: resource.id === selectedResourceId,
      },
    }));

    const flowEdges: Edge[] = edges.map((edge) => {
      const selected = connectedIds.has(edge.source) && connectedIds.has(edge.target);
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.reason === 'explicit_dependency' ? 'depends on' : undefined,
        animated: selected,
        style: { stroke: selected ? '#4fb3a3' : '#52616b', strokeWidth: selected ? 2 : 1 },
        labelStyle: { fill: '#aeb8bf', fontSize: 11 },
      };
    });

    const layoutedResourceNodes = layoutGraph(resourceNodes, flowEdges);
    const zoneNodes = buildProviderZoneNodes(layoutedResourceNodes);

    return {
      nodes: [...zoneNodes, ...layoutedResourceNodes] as Node<ResourceNodeData | ProviderZoneData>[],
      edges: flowEdges,
    };
  }, [edges, findings, resources, selectedResourceId]);

  const exportTelemetry = {
    area: 'state_graph',
    view: 'state',
    node_count_bucket: countBucket(resources.length),
    edge_count_bucket: countBucket(edges.length),
  };

  return (
    <div className="relative h-full min-h-[420px] bg-[#0d1114]">
      <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-md border border-borderSoft bg-panel/95 px-3 py-2 text-xs text-slate-300 shadow-lg">
        <span>{resources.length} nodes</span>
        <span>{edges.length} edges</span>
        <button
          className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted"
          onClick={() => {
            trackButtonClick('fit_state_graph', { area: 'state_graph' });
            fitView();
          }}
          type="button"
        >
          Fit
        </button>
        <button
          className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted"
          onClick={() => {
            trackButtonClick('export_safe_png', { ...exportTelemetry, export_type: 'png' });
            void exportSafePng(safeExport, 'infraspective-state-graph.png');
          }}
          type="button"
        >
          Export safe PNG
        </button>
        <button
          className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted"
          onClick={() => {
            trackButtonClick('copy_safe_summary', { ...exportTelemetry, export_type: 'text' });
            void copySafeExportText(safeExport, 'infraspective-state-summary.txt');
          }}
          type="button"
        >
          Copy safe summary
        </button>
      </div>
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        minZoom={0.15}
        fitView
        onNodeClick={(_, node) => {
          if (node.type === 'resource') {
            selectResource(node.id);
          }
        }}
        onPaneClick={() => selectResource(undefined)}
      >
        <Background color="#2b343b" gap={18} />
        <MiniMap pannable zoomable nodeColor="#4fb3a3" maskColor="rgb(13 17 20 / 0.72)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
