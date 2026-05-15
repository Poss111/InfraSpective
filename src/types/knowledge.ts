export type KnowledgeEntityKind =
  | 'team'
  | 'service'
  | 'application'
  | 'environment'
  | 'cluster'
  | 'namespace'
  | 'workload'
  | 'repository'
  | 'terraform_resource'
  | 'terraform_change'
  | 'terraform_workspace'
  | 'helm_release'
  | 'helm_chart'
  | 'kubernetes_resource'
  | 'secret'
  | 'database'
  | 'queue'
  | 'api'
  | 'unknown';

export type KnowledgeRelationshipType =
  | 'owns'
  | 'contains'
  | 'deployed_to'
  | 'depends_on'
  | 'managed_by'
  | 'references'
  | 'provisions'
  | 'exposes'
  | 'consumes'
  | 'changes'
  | 'uses';

export type KnowledgeSourceType = 'terraform_state' | 'terraform_plan' | 'kubernetes_manifest' | 'helm_metadata';

export type KnowledgeSource = {
  id: string;
  type: KnowledgeSourceType;
  label: string;
};

export type KnowledgeEntity = {
  id: string;
  kind: KnowledgeEntityKind;
  label: string;
  provider?: string;
  namespace?: string;
  environment?: string;
  owner?: string;
  sourceIds: string[];
  metadata: Record<string, string | number | boolean>;
  tags: Record<string, string>;
};

export type KnowledgeRelationship = {
  id: string;
  source: string;
  target: string;
  type: KnowledgeRelationshipType;
  sourceIds: string[];
  metadata: Record<string, string | number | boolean>;
};

export type KnowledgeInsightSeverity = 'info' | 'warning' | 'critical';

export type KnowledgeInsight = {
  id: string;
  entityId?: string;
  relationshipId?: string;
  severity: KnowledgeInsightSeverity;
  category: 'ownership' | 'structure' | 'dependency' | 'governance';
  title: string;
  message: string;
};

export type KnowledgeGraph = {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  sources: KnowledgeSource[];
  insights: KnowledgeInsight[];
  warnings: string[];
};

export type GraphIngestorInput = {
  id: string;
  label: string;
  contents: string;
  json?: unknown;
};

export type GraphIngestorResult = {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  sources: KnowledgeSource[];
  warnings: string[];
};

export type GraphIngestor = {
  id: string;
  label: string;
  canIngest: (input: GraphIngestorInput) => boolean;
  ingest: (input: GraphIngestorInput) => GraphIngestorResult;
};
