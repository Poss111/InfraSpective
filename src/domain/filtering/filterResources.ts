import type { Finding } from '../../types/findings';
import type { InfraEdge, InfraResource } from '../../types/infra';
import type { InfraFilters } from '../../state/useInfraStore';

export function filterResources(resources: InfraResource[], findings: Finding[], filters: InfraFilters): InfraResource[] {
  const findingResourceIds = new Set(
    findings
      .filter((finding) => filters.severity === 'all' || finding.severity === filters.severity)
      .map((finding) => finding.resourceId)
      .filter(Boolean),
  );
  const query = filters.search.trim().toLowerCase();

  return resources.filter((resource) => {
    const searchable = [resource.address, resource.name, resource.type, resource.provider, resource.module]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (filters.provider === 'all' || resource.provider === filters.provider) &&
      (filters.type === 'all' || resource.type === filters.type) &&
      (filters.module === 'all' || (resource.module ?? '(root)') === filters.module) &&
      (filters.mode === 'all' || resource.mode === filters.mode) &&
      (filters.severity === 'all' || findingResourceIds.has(resource.id)) &&
      (!filters.onlyWithFindings || findings.some((finding) => finding.resourceId === resource.id))
    );
  });
}

export function filterEdges(edges: InfraEdge[], visibleResources: InfraResource[]): InfraEdge[] {
  const visibleIds = new Set(visibleResources.map((resource) => resource.id));
  return edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
}
