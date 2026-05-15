import { parseAllDocuments } from 'yaml';
import type { GraphIngestor, KnowledgeEntity, KnowledgeRelationship, KnowledgeSource } from '../../types/knowledge';
import { makeRelationshipId, slug } from './knowledgeGraph';

type KubernetesManifest = {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: Record<string, unknown>;
  type?: string;
};

const supportedKinds = new Set([
  'Namespace',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'Service',
  'Ingress',
  'ConfigMap',
  'Secret',
  'ServiceAccount',
  'Role',
  'RoleBinding',
  'PersistentVolumeClaim',
]);

export const kubernetesKnowledgeIngestor: GraphIngestor = {
  id: 'kubernetes',
  label: 'Kubernetes manifests',
  canIngest: (input) => parseManifests(input.contents).length > 0,
  ingest: (input) => {
    const manifests = parseManifests(input.contents);
    const source = sourceFor(input.id, input.label, manifests.some(hasHelmMetadata) ? 'helm_metadata' : 'kubernetes_manifest');
    const entities: KnowledgeEntity[] = [];
    const relationships: KnowledgeRelationship[] = [];

    for (const manifest of manifests) {
      const entity = entityFromManifest(manifest, source);
      if (!entity) continue;
      entities.push(entity);

      const namespace = manifest.metadata?.namespace;
      if (entity.kind !== 'namespace' && namespace) {
        const namespaceId = namespaceEntityId(namespace);
        entities.push(namespaceEntity(namespace, source));
        relationships.push(relationship(namespaceId, 'contains', entity.id, source.id));
      }

      for (const reference of referencesFromManifest(manifest)) {
        relationships.push(relationship(entity.id, 'references', reference, source.id));
      }

      const releaseName = helmReleaseName(manifest);
      if (releaseName) {
        const namespaceName = namespace ?? 'default';
        const releaseId = helmReleaseEntityId(namespaceName, releaseName);
        const chartName = helmChartName(manifest);
        entities.push(helmReleaseEntity(namespaceName, releaseName, chartName, source));
        relationships.push(relationship(entity.id, 'managed_by', releaseId, source.id));
        relationships.push(relationship(releaseId, 'deployed_to', namespaceEntityId(namespaceName), source.id));

        if (chartName) {
          const chartId = `helm:chart:${slug(chartName)}`;
          entities.push(helmChartEntity(chartName, source));
          relationships.push(relationship(releaseId, 'uses', chartId, source.id));
        }
      }
    }

    return { entities, relationships, sources: [source], warnings: [] };
  },
};

function parseManifests(contents: string): KubernetesManifest[] {
  try {
    return parseAllDocuments(contents)
      .map((document) => document.toJSON() as KubernetesManifest)
      .filter((manifest) => manifest?.kind && manifest.metadata?.name && supportedKinds.has(manifest.kind));
  } catch {
    return [];
  }
}

function entityFromManifest(manifest: KubernetesManifest, source: KnowledgeSource): KnowledgeEntity | undefined {
  if (!manifest.kind || !manifest.metadata?.name) return undefined;
  const namespace = manifest.kind === 'Namespace' ? manifest.metadata.name : manifest.metadata.namespace;
  const labels = manifest.metadata.labels ?? {};
  const annotations = manifest.metadata.annotations ?? {};
  return {
    id: manifest.kind === 'Namespace' ? namespaceEntityId(manifest.metadata.name) : k8sEntityId(manifest.kind, manifest.metadata.name, namespace),
    kind: inferKubernetesKind(manifest.kind),
    label: manifest.kind === 'Namespace' ? manifest.metadata.name : `${manifest.kind}/${manifest.metadata.name}`,
    provider: 'kubernetes',
    namespace,
    environment: labels.env ?? labels.environment ?? labels['app.kubernetes.io/environment'],
    owner: labels.owner ?? labels.team ?? annotations.owner ?? annotations.team,
    sourceIds: [source.id],
    metadata: {
      apiVersion: manifest.apiVersion ?? '',
      kind: manifest.kind,
      name: manifest.metadata.name,
    },
    tags: { ...labels, ...annotations },
  };
}

function namespaceEntity(name: string, source: KnowledgeSource): KnowledgeEntity {
  return {
    id: namespaceEntityId(name),
    kind: 'namespace',
    label: name,
    provider: 'kubernetes',
    namespace: name,
    sourceIds: [source.id],
    metadata: { kind: 'Namespace', name },
    tags: {},
  };
}

function helmReleaseEntity(namespace: string, releaseName: string, chartName: string | undefined, source: KnowledgeSource): KnowledgeEntity {
  return {
    id: helmReleaseEntityId(namespace, releaseName),
    kind: 'helm_release',
    label: releaseName,
    provider: 'helm',
    namespace,
    sourceIds: [source.id],
    metadata: { namespace, chart: chartName ?? '' },
    tags: {},
  };
}

function helmChartEntity(chartName: string, source: KnowledgeSource): KnowledgeEntity {
  return {
    id: `helm:chart:${slug(chartName)}`,
    kind: 'helm_chart',
    label: chartName,
    provider: 'helm',
    sourceIds: [source.id],
    metadata: { chart: chartName },
    tags: {},
  };
}

function referencesFromManifest(manifest: KubernetesManifest): string[] {
  const namespace = manifest.metadata?.namespace;
  const references = new Set<string>();
  collectNamedRefs(manifest.spec, 'secretName', (name) => references.add(k8sEntityId('Secret', name, namespace)));
  collectNamedRefs(manifest.spec, 'secretRef', (name) => references.add(k8sEntityId('Secret', name, namespace)));
  collectNamedRefs(manifest.spec, 'configMapRef', (name) => references.add(k8sEntityId('ConfigMap', name, namespace)));
  collectNamedRefs(manifest.spec, 'configMapName', (name) => references.add(k8sEntityId('ConfigMap', name, namespace)));
  collectNamedRefs(manifest.spec, 'serviceAccountName', (name) => references.add(k8sEntityId('ServiceAccount', name, namespace)));
  return [...references];
}

function collectNamedRefs(value: unknown, key: string, onName: (name: string) => void) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectNamedRefs(item, key, onName));
    return;
  }
  const record = value as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === 'string') onName(direct);
  if (direct && typeof direct === 'object' && !Array.isArray(direct) && typeof (direct as Record<string, unknown>).name === 'string') {
    onName((direct as Record<string, string>).name);
  }
  Object.values(record).forEach((child) => collectNamedRefs(child, key, onName));
}

function inferKubernetesKind(kind: string): KnowledgeEntity['kind'] {
  if (kind === 'Namespace') return 'namespace';
  if (kind === 'Deployment' || kind === 'StatefulSet' || kind === 'DaemonSet') return 'workload';
  if (kind === 'Secret') return 'secret';
  return 'kubernetes_resource';
}

function hasHelmMetadata(manifest: KubernetesManifest): boolean {
  return Boolean(helmReleaseName(manifest));
}

function helmReleaseName(manifest: KubernetesManifest): string | undefined {
  return manifest.metadata?.annotations?.['meta.helm.sh/release-name'] ?? manifest.metadata?.labels?.['app.kubernetes.io/instance'];
}

function helmChartName(manifest: KubernetesManifest): string | undefined {
  return manifest.metadata?.labels?.['helm.sh/chart'];
}

function sourceFor(id: string, label: string, type: KnowledgeSource['type']): KnowledgeSource {
  return { id, label, type };
}

function relationship(source: string, type: KnowledgeRelationship['type'], target: string, sourceId: string): KnowledgeRelationship {
  return {
    id: makeRelationshipId(source, type, target),
    source,
    target,
    type,
    sourceIds: [sourceId],
    metadata: {},
  };
}

function namespaceEntityId(name: string): string {
  return `kubernetes:namespace:${slug(name)}`;
}

function k8sEntityId(kind: string, name: string, namespace?: string): string {
  const namespacePart = namespace ? `${slug(namespace)}:` : '';
  return `kubernetes:${slug(kind)}:${namespacePart}${slug(name)}`;
}

function helmReleaseEntityId(namespace: string, name: string): string {
  return `helm:release:${slug(namespace)}:${slug(name)}`;
}
