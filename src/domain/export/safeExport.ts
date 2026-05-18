import type { Finding } from '../../types/findings';
import type { InfraEdge, InfraResource } from '../../types/infra';
import type { KnowledgeGraph } from '../../types/knowledge';
import type { PlanEdge, PlanResourceChange } from '../../types/plan';

export type SafeExportView = 'state' | 'plan' | 'knowledge';

export type SafeExportNode = {
  id: string;
  alias: string;
  kind: string;
  provider?: string;
  mode: 'managed' | 'data' | 'entity';
  status?: string;
  countLabel?: string;
};

export type SafeExportSummary = {
  view: SafeExportView;
  generatedAt: string;
  nodes: SafeExportNode[];
  edges: Array<{ source: string; target: string }>;
  totals: Record<string, number>;
};

const SVG_NODE_WIDTH = 190;
const SVG_NODE_HEIGHT = 78;
const SVG_GAP_X = 44;
const SVG_GAP_Y = 52;
const SVG_PADDING = 36;

export function buildStateSafeExport(
  resources: InfraResource[],
  edges: InfraEdge[],
  findings: Finding[],
  generatedAt = new Date().toISOString(),
): SafeExportSummary {
  const aliases = buildAliasMap(resources.map((resource) => resource.id), 'Resource');
  const findingCounts = countFindingsByResource(findings);
  const safeEdges = mapSafeEdges(edges, aliases);

  return {
    view: 'state',
    generatedAt,
    nodes: resources.map((resource) => {
      const findingCount = findingCounts.get(resource.id) ?? 0;
      return {
        id: aliases.get(resource.id) ?? resource.id,
        alias: aliases.get(resource.id) ?? 'Resource',
        kind: resource.type,
        provider: resource.provider,
        mode: resource.mode,
        status: highestSeverity(findings.filter((finding) => finding.resourceId === resource.id)),
        countLabel: findingCount ? `${findingCount} findings` : undefined,
      };
    }),
    edges: safeEdges,
    totals: {
      nodes: resources.length,
      edges: safeEdges.length,
      managed: resources.filter((resource) => resource.mode === 'managed').length,
      data: resources.filter((resource) => resource.mode === 'data').length,
      findings: findings.filter((finding) => finding.resourceId && aliases.has(finding.resourceId)).length,
      criticalFindings: findings.filter((finding) => finding.resourceId && aliases.has(finding.resourceId) && finding.severity === 'critical').length,
      warningFindings: findings.filter((finding) => finding.resourceId && aliases.has(finding.resourceId) && finding.severity === 'warning').length,
      infoFindings: findings.filter((finding) => finding.resourceId && aliases.has(finding.resourceId) && finding.severity === 'info').length,
    },
  };
}

export function buildPlanSafeExport(
  changes: PlanResourceChange[],
  edges: PlanEdge[],
  generatedAt = new Date().toISOString(),
): SafeExportSummary {
  const aliases = buildAliasMap(changes.map((change) => change.id), 'Change');
  const safeEdges = mapSafeEdges(edges, aliases);

  return {
    view: 'plan',
    generatedAt,
    nodes: changes.map((change) => ({
      id: aliases.get(change.id) ?? change.id,
      alias: aliases.get(change.id) ?? 'Change',
      kind: change.type,
      provider: change.provider,
      mode: change.mode,
      status: change.action,
      countLabel: change.changedFields.length ? `${change.changedFields.length} changed fields` : undefined,
    })),
    edges: safeEdges,
    totals: {
      nodes: changes.length,
      edges: safeEdges.length,
      create: changes.filter((change) => change.action === 'create').length,
      update: changes.filter((change) => change.action === 'update').length,
      delete: changes.filter((change) => change.action === 'delete').length,
      replace: changes.filter((change) => change.action === 'replace').length,
      read: changes.filter((change) => change.action === 'read').length,
      noOp: changes.filter((change) => change.action === 'no-op').length,
      changedFields: changes.reduce((total, change) => total + change.changedFields.length, 0),
    },
  };
}

export function buildKnowledgeSafeExport(graph: KnowledgeGraph, generatedAt = new Date().toISOString()): SafeExportSummary {
  const aliases = buildAliasMap(graph.entities.map((entity) => entity.id), 'Entity');
  const safeEdges = mapSafeEdges(graph.relationships, aliases);
  const insightCounts = countInsightsByEntity(graph);

  return {
    view: 'knowledge',
    generatedAt,
    nodes: graph.entities.map((entity) => {
      const insightCount = insightCounts.get(entity.id) ?? 0;
      return {
        id: aliases.get(entity.id) ?? entity.id,
        alias: aliases.get(entity.id) ?? 'Entity',
        kind: entity.kind,
        provider: entity.provider,
        mode: 'entity',
        status: highestKnowledgeSeverity(graph.insights.filter((insight) => insight.entityId === entity.id)),
        countLabel: insightCount ? `${insightCount} insights` : undefined,
      };
    }),
    edges: safeEdges,
    totals: {
      nodes: graph.entities.length,
      edges: safeEdges.length,
      sources: graph.sources.length,
      insights: graph.insights.length,
      criticalInsights: graph.insights.filter((insight) => insight.severity === 'critical').length,
      warningInsights: graph.insights.filter((insight) => insight.severity === 'warning').length,
      infoInsights: graph.insights.filter((insight) => insight.severity === 'info').length,
      warnings: graph.warnings.length,
    },
  };
}

export function makeSafeExportText(summary: SafeExportSummary): string {
  const lines = [
    `InfraSpective safe ${summary.view} export`,
    `Generated: ${summary.generatedAt}`,
    '',
    'Totals',
    ...Object.entries(summary.totals).map(([key, value]) => `- ${formatLabel(key)}: ${value}`),
    '',
    'Nodes',
    ...summary.nodes.map((node) => {
      const details = [node.kind, node.provider, node.mode, node.status, node.countLabel].filter(Boolean).join(' / ');
      return `- ${node.alias}: ${details}`;
    }),
  ];

  if (summary.edges.length > 0) {
    lines.push('', 'Edges', ...summary.edges.map((edge) => `- ${edge.source} -> ${edge.target}`));
  }

  return `${lines.join('\n')}\n`;
}

export function renderSafeExportSvg(summary: SafeExportSummary): string {
  const columns = Math.max(1, Math.ceil(Math.sqrt(summary.nodes.length || 1)));
  const rows = Math.max(1, Math.ceil((summary.nodes.length || 1) / columns));
  const width = SVG_PADDING * 2 + columns * SVG_NODE_WIDTH + (columns - 1) * SVG_GAP_X;
  const height = SVG_PADDING * 2 + 70 + rows * SVG_NODE_HEIGHT + (rows - 1) * SVG_GAP_Y;
  const positions = new Map<string, { x: number; y: number }>();

  summary.nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions.set(node.alias, {
      x: SVG_PADDING + column * (SVG_NODE_WIDTH + SVG_GAP_X),
      y: SVG_PADDING + 70 + row * (SVG_NODE_HEIGHT + SVG_GAP_Y),
    });
  });

  const edges = summary.edges
    .map((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return '';
      const x1 = source.x + SVG_NODE_WIDTH / 2;
      const y1 = source.y + SVG_NODE_HEIGHT;
      const x2 = target.x + SVG_NODE_WIDTH / 2;
      const y2 = target.y;
      return `<path d="M ${x1} ${y1} C ${x1} ${y1 + 30}, ${x2} ${y2 - 30}, ${x2} ${y2}" fill="none" stroke="#52616b" stroke-width="2" marker-end="url(#arrow)" />`;
    })
    .join('');

  const nodes = summary.nodes
    .map((node) => {
      const position = positions.get(node.alias);
      if (!position) return '';
      const secondary = [node.kind, node.provider ?? 'unknown', node.mode].join(' / ');
      return `<g>
        <rect x="${position.x}" y="${position.y}" width="${SVG_NODE_WIDTH}" height="${SVG_NODE_HEIGHT}" rx="8" fill="#151b20" stroke="${statusColor(node.status)}" stroke-width="2" />
        <text x="${position.x + 14}" y="${position.y + 24}" fill="#f8fafc" font-family="monospace" font-size="13" font-weight="700">${escapeXml(node.alias)}</text>
        <text x="${position.x + 14}" y="${position.y + 44}" fill="#aeb8bf" font-family="Arial, sans-serif" font-size="11">${escapeXml(secondary)}</text>
        <text x="${position.x + 14}" y="${position.y + 64}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="11">${escapeXml([node.status, node.countLabel].filter(Boolean).join(' / '))}</text>
      </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#52616b" />
      </marker>
    </defs>
    <rect width="100%" height="100%" fill="#0d1114" />
    <text x="${SVG_PADDING}" y="${SVG_PADDING + 6}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="20" font-weight="700">InfraSpective safe ${escapeXml(summary.view)} export</text>
    <text x="${SVG_PADDING}" y="${SVG_PADDING + 30}" fill="#aeb8bf" font-family="Arial, sans-serif" font-size="12">Sanitized aliases only. Raw Terraform values, addresses, diffs, and file names are not included.</text>
    ${edges}
    ${nodes}
  </svg>`;
}

export function countBucket(count: number): string {
  if (count === 0) return '0';
  if (count <= 10) return '1-10';
  if (count <= 50) return '11-50';
  if (count <= 100) return '51-100';
  return '101+';
}

function buildAliasMap(ids: string[], prefix: 'Resource' | 'Change' | 'Entity'): Map<string, string> {
  return new Map(ids.map((id, index) => [id, `${prefix} ${String(index + 1).padStart(3, '0')}`]));
}

function mapSafeEdges(edges: Array<{ source: string; target: string }>, aliases: Map<string, string>): Array<{ source: string; target: string }> {
  return edges.flatMap((edge) => {
    const source = aliases.get(edge.source);
    const target = aliases.get(edge.target);
    return source && target ? [{ source, target }] : [];
  });
}

function countFindingsByResource(findings: Finding[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    if (!finding.resourceId) {
      continue;
    }
    counts.set(finding.resourceId, (counts.get(finding.resourceId) ?? 0) + 1);
  }
  return counts;
}

function countInsightsByEntity(graph: KnowledgeGraph): Map<string, number> {
  const counts = new Map<string, number>();
  for (const insight of graph.insights) {
    if (!insight.entityId) {
      continue;
    }
    counts.set(insight.entityId, (counts.get(insight.entityId) ?? 0) + 1);
  }
  return counts;
}

function highestSeverity(findings: Finding[]): string | undefined {
  if (findings.some((finding) => finding.severity === 'critical')) return 'critical';
  if (findings.some((finding) => finding.severity === 'warning')) return 'warning';
  if (findings.some((finding) => finding.severity === 'info')) return 'info';
  return undefined;
}

function highestKnowledgeSeverity(insights: KnowledgeGraph['insights']): string | undefined {
  if (insights.some((insight) => insight.severity === 'critical')) return 'critical';
  if (insights.some((insight) => insight.severity === 'warning')) return 'warning';
  if (insights.some((insight) => insight.severity === 'info')) return 'info';
  return undefined;
}

function formatLabel(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}

function statusColor(status?: string): string {
  if (status === 'critical' || status === 'delete') return '#ef4444';
  if (status === 'warning' || status === 'update') return '#f59e0b';
  if (status === 'replace') return '#e879f9';
  if (status === 'read' || status === 'info') return '#38bdf8';
  if (status === 'create') return '#4fb3a3';
  return '#52616b';
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === '&') return '&amp;';
    if (character === '"') return '&quot;';
    return '&apos;';
  });
}
