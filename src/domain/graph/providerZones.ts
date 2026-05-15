import type { Node } from '@xyflow/react';
import type { InfraResource } from '../../types/infra';

export type ProviderZoneData = Record<string, unknown> & {
  provider: string;
  account: string;
  region: string;
  resourceCount: number;
};

type ProviderZoneResourceData = Record<string, unknown> & {
  resource: InfraResource;
};

const NODE_WIDTH = 250;
const NODE_HEIGHT = 86;
const ZONE_PADDING_X = 36;
const ZONE_PADDING_TOP = 48;
const ZONE_PADDING_BOTTOM = 28;

type ZoneGroup = {
  key: string;
  provider: string;
  accounts: Set<string>;
  regions: Set<string>;
  nodes: Node<ProviderZoneResourceData>[];
};

export function buildProviderZoneNodes(nodes: Node<ProviderZoneResourceData>[]): Node<ProviderZoneData>[] {
  const groups = groupByProviderZone(nodes);

  return groups.map((group) => {
    const bounds = getGroupBounds(group.nodes);

    return {
      id: `provider-zone:${group.key}`,
      type: 'providerZone',
      position: {
        x: bounds.minX - ZONE_PADDING_X,
        y: bounds.minY - ZONE_PADDING_TOP,
      },
      data: {
        provider: group.provider,
        account: formatScope(group.accounts, 'account'),
        region: formatScope(group.regions, 'region'),
        resourceCount: group.nodes.length,
      },
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      zIndex: -1,
      style: {
        width: bounds.maxX - bounds.minX + ZONE_PADDING_X * 2,
        height: bounds.maxY - bounds.minY + ZONE_PADDING_TOP + ZONE_PADDING_BOTTOM,
      },
    };
  });
}

function groupByProviderZone(nodes: Node<ProviderZoneResourceData>[]): ZoneGroup[] {
  const groups = new Map<string, ZoneGroup>();

  for (const node of nodes) {
    const resource = node.data.resource;
    const provider = resource.provider ?? 'unknown provider';
    const account = inferAccount(resource);
    const region = inferRegion(resource);
    const key = provider;
    const existing = groups.get(key);

    if (existing) {
      existing.nodes.push(node);
      existing.accounts.add(account);
      existing.regions.add(region);
      continue;
    }

    groups.set(key, {
      key,
      provider,
      accounts: new Set([account]),
      regions: new Set([region]),
      nodes: [node],
    });
  }

  return [...groups.values()];
}

function formatScope(values: Set<string>, label: 'account' | 'region'): string {
  const knownValues = [...values].filter((value) => value !== `unknown ${label}`);
  if (knownValues.length === 0) return `unknown ${label}`;
  if (knownValues.length === 1) return knownValues[0];
  return `mixed ${label}s`;
}

function getGroupBounds(nodes: Node<ProviderZoneResourceData>[]) {
  return nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + NODE_WIDTH),
      maxY: Math.max(bounds.maxY, node.position.y + NODE_HEIGHT),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
}

function inferAccount(resource: InfraResource): string {
  const directValue = firstStringValue(resource.attributes, [
    'account_id',
    'aws_account_id',
    'owner_id',
    'subscription_id',
    'project',
    'project_id',
  ]);
  if (directValue) return directValue;

  const arnAccount = findArnPart(resource.attributes, 4);
  if (arnAccount) return arnAccount;

  return 'unknown account';
}

function inferRegion(resource: InfraResource): string {
  const directValue = firstStringValue(resource.attributes, ['region', 'location', 'zone']);
  if (directValue) return directValue;

  const availabilityZone = firstStringValue(resource.attributes, ['availability_zone']);
  if (availabilityZone) return availabilityZone.replace(/[a-z]$/, '');

  const arnRegion = findArnPart(resource.attributes, 3);
  if (arnRegion) return arnRegion;

  return 'unknown region';
}

function firstStringValue(attributes: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return undefined;
}

function findArnPart(attributes: Record<string, unknown>, index: number): string | undefined {
  for (const value of Object.values(attributes)) {
    if (typeof value !== 'string' || !value.startsWith('arn:')) {
      continue;
    }

    const part = value.split(':')[index];
    if (part) return part;
  }

  return undefined;
}
