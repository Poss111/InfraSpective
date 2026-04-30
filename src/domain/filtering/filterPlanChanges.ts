import type { PlanEdge, PlanResourceChange } from '../../types/plan';
import type { PlanFilters } from '../../state/useInfraStore';

export function filterPlanChanges(changes: PlanResourceChange[], filters: PlanFilters): PlanResourceChange[] {
  const query = filters.search.trim().toLowerCase();

  return changes.filter((change) => {
    const searchable = [change.address, change.name, change.type, change.provider, change.module, change.action]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (filters.action === 'all' || change.action === filters.action) &&
      (filters.provider === 'all' || change.provider === filters.provider) &&
      (filters.type === 'all' || change.type === filters.type) &&
      (filters.module === 'all' || (change.module ?? '(root)') === filters.module)
    );
  });
}

export function filterPlanEdges(edges: PlanEdge[], visibleChanges: PlanResourceChange[]): PlanEdge[] {
  const visibleIds = new Set(visibleChanges.map((change) => change.id));
  return edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
}
