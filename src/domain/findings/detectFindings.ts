import type { InfraEdge, InfraResource } from '../../types/infra';
import type { Finding } from '../../types/findings';
import { isSensitiveKey } from '../redaction/redactSensitiveValues';

const OWNER_TAGS = ['owner', 'team'];
const ENV_TAGS = ['env', 'environment'];

export function detectFindings(resources: InfraResource[], edges: InfraEdge[]): Finding[] {
  const findings: Finding[] = [];
  const degree = buildDegreeMap(resources, edges);

  for (const resource of resources) {
    findings.push(...metadataFindings(resource));
    findings.push(...securityFindings(resource));
    findings.push(...structureFindings(resource, degree.get(resource.id) ?? { in: 0, out: 0 }));
  }

  return findings;
}

function metadataFindings(resource: InfraResource): Finding[] {
  if (resource.mode !== 'managed') {
    return [];
  }

  const findings: Finding[] = [];
  const tagKeys = Object.keys(resource.tags);
  const normalizedTagKeys = tagKeys.map((key) => key.toLowerCase());

  if (tagKeys.length === 0) {
    findings.push({
      id: `${resource.id}:missing-tags`,
      resourceId: resource.id,
      severity: 'warning',
      category: 'metadata',
      title: 'Missing tags',
      description: 'This managed resource has no tags or labels in state.',
    });
    return findings;
  }

  if (!OWNER_TAGS.some((key) => normalizedTagKeys.includes(key))) {
    findings.push({
      id: `${resource.id}:missing-owner`,
      resourceId: resource.id,
      severity: 'warning',
      category: 'metadata',
      title: 'Missing owner tag',
      description: 'No owner or team tag was found for this resource.',
    });
  }

  if (!ENV_TAGS.some((key) => normalizedTagKeys.includes(key))) {
    findings.push({
      id: `${resource.id}:missing-environment`,
      resourceId: resource.id,
      severity: 'info',
      category: 'metadata',
      title: 'Missing environment tag',
      description: 'No env or environment tag was found for this resource.',
    });
  }

  return findings;
}

function securityFindings(resource: InfraResource): Finding[] {
  const findings: Finding[] = [];
  const flattened = flattenAttributes(resource.attributes);

  if (flattened.some(({ value }) => value === '0.0.0.0/0' || value === '::/0')) {
    findings.push({
      id: `${resource.id}:public-cidr`,
      resourceId: resource.id,
      severity: 'critical',
      category: 'security',
      title: 'Public network exposure detected.',
      description: 'An attribute contains a public CIDR range such as 0.0.0.0/0 or ::/0.',
    });
  }

  if (flattened.some(({ key }) => isSensitiveKey(key))) {
    findings.push({
      id: `${resource.id}:likely-secret`,
      resourceId: resource.id,
      severity: 'warning',
      category: 'security',
      title: 'Likely secret value detected',
      description: 'A sensitive-looking attribute key was found. The value is redacted in the UI.',
    });
  }

  return findings;
}

function structureFindings(resource: InfraResource, degree: { in: number; out: number }): Finding[] {
  const findings: Finding[] = [];

  if (resource.mode === 'data') {
    findings.push({
      id: `${resource.id}:data-source`,
      resourceId: resource.id,
      severity: 'info',
      category: 'structure',
      title: 'Data source node',
      description: 'This node represents a Terraform data source, not a managed resource.',
    });
  }

  if (resource.mode === 'managed' && degree.in === 0 && degree.out === 0) {
    findings.push({
      id: `${resource.id}:isolated`,
      resourceId: resource.id,
      severity: 'info',
      category: 'structure',
      title: 'Isolated in state graph',
      description: 'This managed resource has no dependency edges to or from other parsed resources.',
    });
  }

  if (degree.in > 10 || degree.out > 10) {
    findings.push({
      id: `${resource.id}:high-fan`,
      resourceId: resource.id,
      severity: 'warning',
      category: 'structure',
      title: 'High dependency fan-in or fan-out',
      description: 'This resource is connected to more than 10 dependencies or dependents.',
    });
  }

  return findings;
}

function buildDegreeMap(resources: InfraResource[], edges: InfraEdge[]): Map<string, { in: number; out: number }> {
  const degree = new Map(resources.map((resource) => [resource.id, { in: 0, out: 0 }]));

  for (const edge of edges) {
    const source = degree.get(edge.source);
    const target = degree.get(edge.target);
    if (source) source.out += 1;
    if (target) target.in += 1;
  }

  return degree;
}

function flattenAttributes(value: unknown, key = ''): Array<{ key: string; value: unknown }> {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenAttributes(item, `${key}[${index}]`));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([nestedKey, nestedValue]) =>
      flattenAttributes(nestedValue, nestedKey),
    );
  }

  return [{ key, value }];
}
