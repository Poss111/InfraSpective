import type { GraphIngestor, KnowledgeEntity, KnowledgeRelationship, KnowledgeSource } from '../../types/knowledge';
import { buildGraph } from '../graph/buildGraph';
import { buildPlanGraph } from '../graph/buildPlanGraph';
import { parseTerraformPlan, toPlanResourceChanges } from '../terraform/parseTerraformPlan';
import { parseTerraformState, toInfraResources } from '../terraform/parseTerraformState';
import { makeRelationshipId, slug } from './knowledgeGraph';

export const terraformStateKnowledgeIngestor: GraphIngestor = {
  id: 'terraform-state',
  label: 'Terraform state',
  canIngest: (input) => input.json !== undefined && hasArray(input.json, 'resources') && canParse(() => parseTerraformState(input.json)),
  ingest: (input) => {
    const state = parseTerraformState(input.json);
    const graph = buildGraph(toInfraResources(state));
    const source = sourceFor(input.id, input.label, 'terraform_state');
    const entities: KnowledgeEntity[] = graph.nodes.map((resource) => ({
      id: `terraform:resource:${resource.address}`,
      kind: inferTerraformKind(resource.type),
      label: resource.address,
      provider: resource.provider,
      namespace: asString(resource.tags.namespace ?? resource.tags.Namespace),
      environment: extractEnvironment(resource.tags),
      owner: extractOwner(resource.tags),
      sourceIds: [source.id],
      metadata: {
        mode: resource.mode,
        type: resource.type,
        name: resource.name,
        module: resource.module ?? '',
      },
      tags: resource.tags,
    }));

    const relationships: KnowledgeRelationship[] = graph.edges.map((edge) => ({
      id: makeRelationshipId(`terraform:resource:${edge.source}`, 'depends_on', `terraform:resource:${edge.target}`),
      source: `terraform:resource:${edge.source}`,
      target: `terraform:resource:${edge.target}`,
      type: 'depends_on',
      sourceIds: [source.id],
      metadata: { reason: edge.reason },
    }));

    return { entities, relationships, sources: [source], warnings: [] };
  },
};

export const terraformPlanKnowledgeIngestor: GraphIngestor = {
  id: 'terraform-plan',
  label: 'Terraform plan',
  canIngest: (input) => input.json !== undefined && hasArray(input.json, 'resource_changes') && canParse(() => parseTerraformPlan(input.json)),
  ingest: (input) => {
    const plan = parseTerraformPlan(input.json);
    const graph = buildPlanGraph(toPlanResourceChanges(plan));
    const source = sourceFor(input.id, input.label, 'terraform_plan');
    const entities: KnowledgeEntity[] = graph.nodes.map((change) => ({
      id: `terraform:change:${change.address}`,
      kind: 'terraform_change',
      label: change.address,
      provider: change.provider,
      environment: undefined,
      owner: undefined,
      sourceIds: [source.id],
      metadata: {
        action: change.action,
        mode: change.mode,
        type: change.type,
        module: change.module ?? '',
      },
      tags: {},
    }));

    const relationships: KnowledgeRelationship[] = graph.nodes.map((change) => ({
      id: makeRelationshipId(`terraform:change:${change.address}`, 'changes', `terraform:resource:${change.address}`),
      source: `terraform:change:${change.address}`,
      target: `terraform:resource:${change.address}`,
      type: 'changes',
      sourceIds: [source.id],
      metadata: { action: change.action },
    }));

    return { entities, relationships, sources: [source], warnings: [] };
  },
};

function sourceFor(id: string, label: string, type: KnowledgeSource['type']): KnowledgeSource {
  return { id, label, type };
}

function canParse(parse: () => unknown): boolean {
  try {
    parse();
    return true;
  } catch {
    return false;
  }
}

function hasArray(value: unknown, key: string): boolean {
  return typeof value === 'object' && value !== null && Array.isArray((value as Record<string, unknown>)[key]);
}

function inferTerraformKind(type: string): KnowledgeEntity['kind'] {
  if (/(db|database|rds|sql|dynamodb|postgres|mysql)/i.test(type)) return 'database';
  if (/(queue|sqs|pubsub|kafka)/i.test(type)) return 'queue';
  if (/(api|gateway|load_balancer|lb|ingress)/i.test(type)) return 'api';
  if (/(secret|key|kms|vault)/i.test(type)) return 'secret';
  return 'terraform_resource';
}

function extractOwner(tags: Record<string, string>): string | undefined {
  return asString(tags.owner ?? tags.Owner ?? tags.team ?? tags.Team);
}

function extractEnvironment(tags: Record<string, string>): string | undefined {
  return asString(tags.env ?? tags.environment ?? tags.Environment);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? slug(value) : undefined;
}
