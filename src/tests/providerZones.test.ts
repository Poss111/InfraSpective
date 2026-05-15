import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/react';
import { buildProviderZoneNodes } from '../domain/graph/providerZones';
import type { InfraResource } from '../types/infra';

describe('buildProviderZoneNodes', () => {
  it('builds a provider zone with inferred account and region metadata', () => {
    const nodes: Node<{ resource: InfraResource }>[] = [
      {
        id: 'aws_lb.web',
        position: { x: 100, y: 120 },
        data: {
          resource: resource({
            id: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/web/abc',
          }),
        },
      },
      {
        id: 'aws_instance.app',
        position: { x: 420, y: 260 },
        data: {
          resource: resource({
            availability_zone: 'us-east-1a',
          }),
        },
      },
    ];

    const [zone] = buildProviderZoneNodes(nodes);

    expect(zone.data).toMatchObject({
      provider: 'hashicorp/aws',
      account: '123456789012',
      region: 'us-east-1',
      resourceCount: 2,
    });
    expect(zone.position).toEqual({ x: 64, y: 72 });
    expect(zone.style).toMatchObject({ width: 642, height: 302 });
  });

  it('keeps one zone per provider and reports mixed scopes', () => {
    const nodes: Node<{ resource: InfraResource }>[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: { resource: resource({ account_id: '111', region: 'us-east-1' }) } },
      { id: 'b', position: { x: 0, y: 0 }, data: { resource: resource({ account_id: '222', region: 'us-east-1' }) } },
      { id: 'c', position: { x: 0, y: 0 }, data: { resource: resource({ account_id: '111', region: 'us-west-2' }) } },
    ];

    const [zone] = buildProviderZoneNodes(nodes);

    expect(zone.data).toMatchObject({
      account: 'mixed accounts',
      region: 'mixed regions',
      resourceCount: 3,
    });
  });
});

function resource(attributes: Record<string, unknown>): InfraResource {
  return {
    id: 'resource',
    address: 'aws_resource.example',
    mode: 'managed',
    provider: 'hashicorp/aws',
    type: 'aws_resource',
    name: 'example',
    attributes,
    dependencies: [],
    tags: {},
  };
}
