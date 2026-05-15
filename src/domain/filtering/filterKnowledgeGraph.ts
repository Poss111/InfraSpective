import type { KnowledgeEntity, KnowledgeInsight, KnowledgeRelationship } from '../../types/knowledge';

export type KnowledgeFilters = {
  search: string;
  kind: string;
  provider: string;
  namespace: string;
  onlyWithInsights: boolean;
};

export const defaultKnowledgeFilters: KnowledgeFilters = {
  search: '',
  kind: 'all',
  provider: 'all',
  namespace: 'all',
  onlyWithInsights: false,
};

export function filterKnowledgeEntities(
  entities: KnowledgeEntity[],
  insights: KnowledgeInsight[],
  filters: KnowledgeFilters,
): KnowledgeEntity[] {
  const insightEntityIds = new Set(insights.map((insight) => insight.entityId).filter(Boolean));
  const search = filters.search.trim().toLowerCase();

  return entities.filter((entity) => {
    if (filters.kind !== 'all' && entity.kind !== filters.kind) return false;
    if (filters.provider !== 'all' && entity.provider !== filters.provider) return false;
    if (filters.namespace !== 'all' && entity.namespace !== filters.namespace) return false;
    if (filters.onlyWithInsights && !insightEntityIds.has(entity.id)) return false;
    if (!search) return true;
    return [entity.label, entity.kind, entity.provider, entity.namespace, entity.owner, ...Object.values(entity.tags)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
}

export function filterKnowledgeRelationships(
  relationships: KnowledgeRelationship[],
  visibleEntities: KnowledgeEntity[],
): KnowledgeRelationship[] {
  const visibleIds = new Set(visibleEntities.map((entity) => entity.id));
  return relationships.filter((relationship) => visibleIds.has(relationship.source) && visibleIds.has(relationship.target));
}
