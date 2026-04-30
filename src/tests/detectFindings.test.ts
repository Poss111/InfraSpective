import { describe, expect, it } from 'vitest';
import sampleState from '../testdata/sample.tfstate.json';
import { detectFindings } from '../domain/findings/detectFindings';
import { buildGraph } from '../domain/graph/buildGraph';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';

describe('detectFindings', () => {
  it('detects MVP finding categories', () => {
    const graph = buildGraph(toInfraResources(parseTerraformState(sampleState)));
    const findings = detectFindings(graph.nodes, graph.edges);
    const titles = findings.map((finding) => finding.title);

    expect(titles).toContain('Missing tags');
    expect(titles).toContain('Missing owner tag');
    expect(titles).toContain('Missing environment tag');
    expect(titles).toContain('Public network exposure detected.');
    expect(titles).toContain('Likely secret value detected');
    expect(titles).toContain('Data source node');
    expect(titles).toContain('Isolated in state graph');
  });
});
