import type { InfraEdge, InfraGraph, InfraResource } from '../../types/infra';

export function buildGraph(resources: InfraResource[]): InfraGraph {
  const byAddress = new Map(resources.map((resource) => [resource.address, resource]));
  const edges: InfraEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    for (const dependency of resource.dependencies) {
      const source = byAddress.get(dependency);
      if (!source || source.id === resource.id) {
        continue;
      }

      const id = `${source.id}->${resource.id}`;
      if (seen.has(id)) {
        continue;
      }

      seen.add(id);
      edges.push({
        id,
        source: source.id,
        target: resource.id,
        reason: 'explicit_dependency',
      });
    }
  }

  return { nodes: resources, edges };
}
