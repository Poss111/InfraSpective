import { useMemo } from 'react';
import { Background, Controls, Edge, MiniMap, Node, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import type { KnowledgeEntity, KnowledgeInsight, KnowledgeRelationship } from '../../types/knowledge';
import { layoutGraph } from '../../domain/graph/layoutGraph';
import { useInfraStore } from '../../state/useInfraStore';
import { KnowledgeNode, type KnowledgeNodeData } from './KnowledgeNode';

const nodeTypes = { knowledge: KnowledgeNode };

type KnowledgeGraphPanelProps = {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  insights: KnowledgeInsight[];
};

export function KnowledgeGraphPanel(props: KnowledgeGraphPanelProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphPanelInner {...props} />
    </ReactFlowProvider>
  );
}

function KnowledgeGraphPanelInner({ entities, relationships, insights }: KnowledgeGraphPanelProps) {
  const selectedEntityId = useInfraStore((store) => store.selectedKnowledgeEntityId);
  const selectKnowledgeEntity = useInfraStore((store) => store.selectKnowledgeEntity);
  const { fitView } = useReactFlow();

  const graph = useMemo(() => {
    const connectedIds = new Set(
      relationships.flatMap((relationship) =>
        relationship.source === selectedEntityId || relationship.target === selectedEntityId ? [relationship.source, relationship.target] : [],
      ),
    );

    const nodes: Node<KnowledgeNodeData>[] = entities.map((entity) => ({
      id: entity.id,
      type: 'knowledge',
      position: { x: 0, y: 0 },
      data: {
        entity,
        insights: insights.filter((insight) => insight.entityId === entity.id),
        selected: entity.id === selectedEntityId,
      },
    }));

    const edges: Edge[] = relationships.map((relationship) => {
      const selected = connectedIds.has(relationship.source) && connectedIds.has(relationship.target);
      return {
        id: relationship.id,
        source: relationship.source,
        target: relationship.target,
        label: relationship.type.replace(/_/g, ' '),
        animated: selected,
        style: { stroke: selected ? '#4fb3a3' : '#52616b', strokeWidth: selected ? 2 : 1 },
        labelStyle: { fill: '#aeb8bf', fontSize: 11 },
      };
    });

    return { nodes: layoutGraph(nodes, edges), edges };
  }, [entities, insights, relationships, selectedEntityId]);

  return (
    <div className="relative h-full min-h-[420px] bg-[#0d1114]">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-md border border-borderSoft bg-panel/95 px-3 py-2 text-xs text-slate-300 shadow-lg">
        <span>{entities.length} entities</span>
        <span>{relationships.length} relationships</span>
        <button className="rounded border border-borderSoft px-2 py-1 hover:bg-panelMuted" onClick={() => fitView()} type="button">
          Fit
        </button>
      </div>
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        minZoom={0.15}
        fitView
        onNodeClick={(_, node) => selectKnowledgeEntity(node.id)}
        onPaneClick={() => selectKnowledgeEntity(undefined)}
      >
        <Background color="#2b343b" gap={18} />
        <MiniMap pannable zoomable nodeColor="#4fb3a3" maskColor="rgb(13 17 20 / 0.72)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
