import { describe, expect, it } from 'vitest';
import { buildKnowledgeGraphFromFiles } from '../domain/knowledge/knowledgeGraph';
import sampleState from '../testdata/sample.tfstate.json';
import samplePlan from '../testdata/sample.plan.json';

const kubernetesYaml = `
apiVersion: v1
kind: Namespace
metadata:
  name: platform
  labels:
    owner: platform-team
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: platform
  labels:
    app.kubernetes.io/instance: platform-api
    helm.sh/chart: api-1.2.0
    team: app-platform
spec:
  template:
    spec:
      serviceAccountName: api
      containers:
        - name: api
          image: example/api:latest
          envFrom:
            - secretRef:
                name: api-secrets
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: platform
`;

describe('knowledge graph ingestion', () => {
  it('builds a normalized graph from Terraform state, plan, Kubernetes, and Helm metadata', () => {
    const graph = buildKnowledgeGraphFromFiles([
      { name: 'sample.tfstate.json', contents: JSON.stringify(sampleState) },
      { name: 'sample.plan.json', contents: JSON.stringify(samplePlan) },
      { name: 'kubernetes.yaml', contents: kubernetesYaml },
    ]);

    expect(graph.entities.some((entity) => entity.id.startsWith('terraform:resource:'))).toBe(true);
    expect(graph.entities.some((entity) => entity.kind === 'terraform_change')).toBe(true);
    expect(graph.entities).toContainEqual(expect.objectContaining({ id: 'kubernetes:namespace:platform', kind: 'namespace' }));
    expect(graph.entities).toContainEqual(expect.objectContaining({ id: 'helm:release:platform:platform-api', kind: 'helm_release' }));
    expect(graph.relationships).toContainEqual(
      expect.objectContaining({
        source: 'kubernetes:namespace:platform',
        target: 'kubernetes:deployment:platform:api',
        type: 'contains',
      }),
    );
    expect(graph.relationships).toContainEqual(
      expect.objectContaining({
        source: 'kubernetes:deployment:platform:api',
        target: 'kubernetes:secret:platform:api-secrets',
        type: 'references',
      }),
    );
  });

  it('skips unsupported files without failing the whole graph', () => {
    const graph = buildKnowledgeGraphFromFiles([
      { name: 'notes.txt', contents: 'hello' },
      { name: 'kubernetes.yaml', contents: kubernetesYaml },
    ]);

    expect(graph.entities.length).toBeGreaterThan(0);
    expect(graph.warnings).toContain('notes.txt was skipped because it is not a supported infrastructure source.');
  });
});
