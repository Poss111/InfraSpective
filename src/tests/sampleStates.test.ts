import type { Node } from '@xyflow/react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGraph } from '../domain/graph/buildGraph';
import { buildProviderZoneNodes } from '../domain/graph/providerZones';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';
import type { InfraResource } from '../types/infra';

describe('sample Terraform states', () => {
  const samplesDir = join(process.cwd(), 'samples');
  const sampleFiles = readdirSync(samplesDir).filter((file) => file.endsWith('.tfstate.json'));

  it('keeps sample fixtures available', () => {
    expect(sampleFiles).toEqual(['aws-small.tfstate.json', 'edge-cases.tfstate.json', 'multi-cloud.tfstate.json']);
  });

  it.each(sampleFiles)('parses and graphs %s', (file) => {
    const json = JSON.parse(readFileSync(join(samplesDir, file), 'utf8'));
    const resources = toInfraResources(parseTerraformState(json));
    const graph = buildGraph(resources);

    expect(resources.length).toBeGreaterThan(0);
    expect(graph.nodes.length).toBe(resources.length);
  });

  it('includes explicit provider boundary scopes in the multi-cloud sample', () => {
    const json = JSON.parse(readFileSync(join(samplesDir, 'multi-cloud.tfstate.json'), 'utf8'));
    const resources = toInfraResources(parseTerraformState(json));
    const nodes: Node<{ resource: InfraResource }>[] = resources.map((resource, index) => ({
      id: resource.id,
      position: { x: index * 300, y: 0 },
      data: { resource },
    }));
    const zones = buildProviderZoneNodes(nodes);

    expect(zones.map((zone) => zone.data.provider).sort()).toEqual([
      'hashicorp/aws',
      'hashicorp/azurerm',
      'hashicorp/google',
    ]);
    expect(zones.find((zone) => zone.data.provider === 'hashicorp/aws')?.data).toMatchObject({
      account: '222233334444',
      region: 'us-west-2',
      resourceCount: 2,
    });
    expect(zones.find((zone) => zone.data.provider === 'hashicorp/google')?.data).toMatchObject({
      account: 'sample-data',
      region: 'us-central1',
      resourceCount: 2,
    });
    expect(zones.find((zone) => zone.data.provider === 'hashicorp/azurerm')?.data).toMatchObject({
      account: '00000000-0000-0000-0000-000000000000',
      region: 'eastus',
      resourceCount: 2,
    });
  });
});
