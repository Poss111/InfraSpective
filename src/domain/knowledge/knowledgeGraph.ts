import type {
  GraphIngestor,
  GraphIngestorInput,
  GraphIngestorResult,
  KnowledgeEntity,
  KnowledgeGraph,
  KnowledgeInsight,
  KnowledgeRelationship,
  KnowledgeSource,
} from '../../types/knowledge';
import { terraformPlanKnowledgeIngestor, terraformStateKnowledgeIngestor } from './terraformKnowledgeIngestor';
import { kubernetesKnowledgeIngestor } from './kubernetesKnowledgeIngestor';

export type KnowledgeInputFile = {
  name: string;
  contents: string;
};

const ingestors: GraphIngestor[] = [terraformStateKnowledgeIngestor, terraformPlanKnowledgeIngestor, kubernetesKnowledgeIngestor];

export function buildKnowledgeGraphFromFiles(files: KnowledgeInputFile[]): KnowledgeGraph {
  const results: GraphIngestorResult[] = [];
  const warnings: string[] = [];

  files.forEach((file, index) => {
    const input: GraphIngestorInput = {
      id: `source:${index + 1}`,
      label: file.name,
      contents: file.contents,
      json: parseJson(file.contents),
    };
    const ingestor = ingestors.find((candidate) => candidate.canIngest(input));

    if (!ingestor) {
      warnings.push(`${file.name} was skipped because it is not a supported infrastructure source.`);
      return;
    }

    try {
      const result = ingestor.ingest(input);
      results.push(result);
      warnings.push(...result.warnings);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${file.name} could not be ingested.`);
    }
  });

  const graph = mergeKnowledgeResults(results, warnings);
  return { ...graph, insights: detectKnowledgeInsights(graph.entities, graph.relationships) };
}

export function mergeKnowledgeResults(results: GraphIngestorResult[], warnings: string[] = []): KnowledgeGraph {
  const entityMap = new Map<string, KnowledgeEntity>();
  const relationshipMap = new Map<string, KnowledgeRelationship>();
  const sourceMap = new Map<string, KnowledgeSource>();

  for (const result of results) {
    for (const source of result.sources) {
      sourceMap.set(source.id, source);
    }

    for (const entity of result.entities) {
      const existing = entityMap.get(entity.id);
      entityMap.set(entity.id, existing ? mergeEntity(existing, entity) : entity);
    }

    for (const relationship of result.relationships) {
      const existing = relationshipMap.get(relationship.id);
      relationshipMap.set(relationship.id, existing ? mergeRelationship(existing, relationship) : relationship);
    }
  }

  return {
    entities: [...entityMap.values()],
    relationships: [...relationshipMap.values()].filter(
      (relationship) => entityMap.has(relationship.source) && entityMap.has(relationship.target) && relationship.source !== relationship.target,
    ),
    sources: [...sourceMap.values()],
    insights: [],
    warnings,
  };
}

export function makeRelationshipId(source: string, type: string, target: string): string {
  return `${source}->${type}->${target}`;
}

export function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

function mergeEntity(left: KnowledgeEntity, right: KnowledgeEntity): KnowledgeEntity {
  return {
    ...left,
    label: left.label || right.label,
    provider: left.provider ?? right.provider,
    namespace: left.namespace ?? right.namespace,
    environment: left.environment ?? right.environment,
    owner: left.owner ?? right.owner,
    sourceIds: unique([...left.sourceIds, ...right.sourceIds]),
    metadata: { ...right.metadata, ...left.metadata },
    tags: { ...right.tags, ...left.tags },
  };
}

function mergeRelationship(left: KnowledgeRelationship, right: KnowledgeRelationship): KnowledgeRelationship {
  return {
    ...left,
    sourceIds: unique([...left.sourceIds, ...right.sourceIds]),
    metadata: { ...right.metadata, ...left.metadata },
  };
}

function detectKnowledgeInsights(entities: KnowledgeEntity[], relationships: KnowledgeRelationship[]): KnowledgeInsight[] {
  const insights: KnowledgeInsight[] = [];
  const connected = new Map<string, number>();

  for (const relationship of relationships) {
    connected.set(relationship.source, (connected.get(relationship.source) ?? 0) + 1);
    connected.set(relationship.target, (connected.get(relationship.target) ?? 0) + 1);
  }

  for (const entity of entities) {
    if (entity.kind !== 'team' && entity.kind !== 'helm_chart' && !entity.owner) {
      insights.push({
        id: `missing-owner:${entity.id}`,
        entityId: entity.id,
        severity: 'warning',
        category: 'ownership',
        title: 'Missing owner',
        message: `${entity.label} does not expose owner or team metadata.`,
      });
    }

    if ((connected.get(entity.id) ?? 0) === 0) {
      insights.push({
        id: `isolated:${entity.id}`,
        entityId: entity.id,
        severity: 'info',
        category: 'structure',
        title: 'Isolated entity',
        message: `${entity.label} is not connected to other known infrastructure entities.`,
      });
    }
  }

  for (const [entityId, count] of connected) {
    if (count >= 6) {
      const entity = entities.find((candidate) => candidate.id === entityId);
      insights.push({
        id: `high-connectivity:${entityId}`,
        entityId,
        severity: 'info',
        category: 'dependency',
        title: 'High connectivity',
        message: `${entity?.label ?? entityId} participates in ${count} relationships.`,
      });
    }
  }

  return insights;
}

function parseJson(contents: string): unknown | undefined {
  try {
    return JSON.parse(contents);
  } catch {
    return undefined;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
