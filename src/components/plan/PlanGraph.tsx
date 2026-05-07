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
import type { PlanEdge, PlanResourceChange } from '../../types/plan';
import { layoutGraph } from '../../domain/graph/layoutGraph';
import { buildPlanSafeExport, copySafeExportText, countBucket, exportSafePng } from '../../domain/export/safeExport';
import { trackButtonClick } from '../../analytics/googleAnalytics';
import { useInfraStore } from '../../state/useInfraStore';
import { PlanNode, type PlanNodeData } from './PlanNode';

const nodeTypes = { plan: PlanNode };

type PlanGraphProps = {
  changes: PlanResourceChange[];
  edges: PlanEdge[];
};

export function PlanGraph(props: PlanGraphProps) {
  return (
    <ReactFlowProvider>
      <PlanGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function PlanGraphInner({ changes, edges }: PlanGraphProps) {
  const selectedPlanChangeId = useInfraStore((store) => store.selectedPlanChangeId);
  const selectPlanChange = useInfraStore((store) => store.selectPlanChange);
  const { fitView } = useReactFlow();
  const safeExport = useMemo(() => buildPlanSafeExport(changes, edges), [changes, edges]);

  const graph = useMemo(() => {
    const nodes: Node<PlanNodeData>[] = changes.map((change) => ({
      id: change.id,
      type: 'plan',
      position: { x: 0, y: 0 },
      data: {
        change,
        selected: change.id === selectedPlanChangeId,
      },
    }));

    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      style: { stroke: '#52616b' },
    }));

    return {
      nodes: layoutGraph(nodes, flowEdges),
      edges: flowEdges,
    };
  }, [changes, edges, selectedPlanChangeId]);

  const exportTelemetry = {
    area: 'plan_graph',
    view: 'plan',
    node_count_bucket: countBucket(changes.length),
    edge_count_bucket: countBucket(edges.length),
  };

  return (
    <div className="relative h-full min-h-[420px] bg-[#0d1114]">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-md border border-borderSoft bg-panel/95 px-3 py-2 text-xs text-slate-300 shadow-lg">
        <span>{changes.length} changes</span>
        <button
          className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted"
          onClick={() => {
            trackButtonClick('fit_plan_graph', { area: 'plan_graph' });
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
            void exportSafePng(safeExport, 'infraspective-plan-graph.png');
          }}
          type="button"
        >
          Export safe PNG
        </button>
        <button
          className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted"
          onClick={() => {
            trackButtonClick('copy_safe_summary', { ...exportTelemetry, export_type: 'text' });
            void copySafeExportText(safeExport, 'infraspective-plan-summary.txt');
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
        onNodeClick={(_, node) => selectPlanChange(node.id)}
        onPaneClick={() => selectPlanChange(undefined)}
      >
        <Background color="#2b343b" gap={18} />
        <MiniMap pannable zoomable nodeColor="#4fb3a3" maskColor="rgb(13 17 20 / 0.72)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
