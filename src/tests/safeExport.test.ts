import { describe, expect, it } from 'vitest';
import samplePlan from '../testdata/sample.plan.json';
import sampleState from '../testdata/sample.tfstate.json';
import { buildGraph } from '../domain/graph/buildGraph';
import { detectFindings } from '../domain/findings/detectFindings';
import {
  buildPlanSafeExport,
  buildStateSafeExport,
  makeSafeExportText,
  renderSafeExportSvg,
} from '../domain/export/safeExport';
import { parseTerraformPlan, toPlanResourceChanges } from '../domain/terraform/parseTerraformPlan';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';

describe('safeExport', () => {
  it('builds a sanitized state summary without addresses or raw values', () => {
    const resources = toInfraResources(parseTerraformState(sampleState));
    const graph = buildGraph(resources);
    const findings = detectFindings(graph.nodes, graph.edges);
    const summary = buildStateSafeExport(graph.nodes, graph.edges, findings, '2026-05-06T00:00:00.000Z');
    const text = makeSafeExportText(summary);
    const svg = renderSafeExportSvg(summary);

    expect(summary.nodes[0].alias).toBe('Resource 001');
    expect(text).toContain('Resource 001');
    expect(text).toContain('aws_vpc');
    expect(text).not.toContain('aws_vpc.main');
    expect(text).not.toContain('sample-main-vpc');
    expect(svg).not.toContain('aws_vpc.main');
    expect(svg).not.toContain('sample-main-vpc');
  });

  it('builds a sanitized plan summary without addresses, diffs, or secret values', () => {
    const changes = toPlanResourceChanges(parseTerraformPlan(samplePlan));
    const summary = buildPlanSafeExport(changes, [], '2026-05-06T00:00:00.000Z');
    const text = makeSafeExportText(summary);
    const svg = renderSafeExportSvg(summary);

    expect(summary.nodes[0].alias).toBe('Change 001');
    expect(text).toContain('Change 001');
    expect(text).toContain('aws_instance');
    expect(text).not.toContain('module.app.aws_instance.app[0]');
    expect(text).not.toContain('old-secret-value');
    expect(text).not.toContain('new-secret-value');
    expect(text).not.toContain('instance_type');
    expect(svg).not.toContain('module.app.aws_instance.app[0]');
    expect(svg).not.toContain('old-secret-value');
  });
});
