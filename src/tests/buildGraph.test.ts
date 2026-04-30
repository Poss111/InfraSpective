import { describe, expect, it } from 'vitest';
import sampleState from '../testdata/sample.tfstate.json';
import { buildGraph } from '../domain/graph/buildGraph';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';

describe('buildGraph', () => {
  it('builds dependency edges only for known parsed resources', () => {
    const resources = toInfraResources(parseTerraformState(sampleState));
    const graph = buildGraph(resources);

    expect(graph.nodes).toHaveLength(7);
    expect(graph.edges.map((edge) => edge.id)).toContain('aws_vpc.main->module.network.aws_subnet.public[0]');
    expect(graph.edges.map((edge) => edge.id)).toContain('data.aws_ami.ubuntu->module.app.aws_instance.server[0]');
    expect(graph.edges.every((edge) => graph.nodes.some((node) => node.id === edge.source))).toBe(true);
    expect(graph.edges.every((edge) => graph.nodes.some((node) => node.id === edge.target))).toBe(true);
  });
});
