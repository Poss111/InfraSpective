import { describe, expect, it } from 'vitest';
import sampleState from '../testdata/sample.tfstate.json';
import { buildResourceAddress } from '../domain/terraform/buildResourceAddress';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';
import type { TerraformStateResource } from '../types/terraform';

describe('parseTerraformState', () => {
  it('parses the bundled sample state', () => {
    const parsed = parseTerraformState(sampleState);
    const resources = toInfraResources(parsed);

    expect(parsed.version).toBe(4);
    expect(resources).toHaveLength(9);
    expect(resources.map((resource) => resource.address)).toContain('module.app.aws_instance.server[0]');
    expect(resources.map((resource) => resource.address)).toContain('aws_iam_role.service["api"]');
    expect(resources.map((resource) => resource.provider)).toContain('hashicorp/google');
    expect(resources.map((resource) => resource.address)).toContain('module.analytics.google_storage_bucket.exports');
  });

  it('rejects unsupported state shapes', () => {
    expect(() => parseTerraformState({ hello: 'world' })).toThrow(/missing Terraform state markers/i);
    expect(() => parseTerraformState({ version: 4, resources: [{ mode: 'bad' }] })).toThrow(/supported Terraform state/i);
  });

  it('handles missing resources safely', () => {
    const parsed = parseTerraformState({ version: 4, outputs: {} });

    expect(toInfraResources(parsed)).toEqual([]);
  });

  it('builds module and instance addresses', () => {
    const resource: TerraformStateResource = {
      mode: 'managed',
      module: 'module.app',
      type: 'aws_instance',
      name: 'server',
    };

    expect(buildResourceAddress(resource, { index_key: 0 })).toBe('module.app.aws_instance.server[0]');
    expect(buildResourceAddress(resource, { index_key: 'api' })).toBe('module.app.aws_instance.server["api"]');
  });
});
