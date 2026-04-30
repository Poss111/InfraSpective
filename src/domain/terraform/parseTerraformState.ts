import type { InfraResource } from '../../types/infra';
import type { TerraformState, TerraformStateInstance, TerraformStateResource } from '../../types/terraform';
import { buildResourceAddress } from './buildResourceAddress';
import { terraformStateSchema } from './terraformStateSchema';

export class TerraformStateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TerraformStateParseError';
  }
}

export function parseTerraformState(json: unknown): TerraformState {
  const parsed = terraformStateSchema.safeParse(json);
  if (!parsed.success) {
    throw new TerraformStateParseError('This file does not look like a supported Terraform state JSON file.');
  }

  if (!looksLikeTerraformState(parsed.data)) {
    throw new TerraformStateParseError('This JSON is valid, but it is missing Terraform state markers.');
  }

  return parsed.data;
}

export function toInfraResources(state: TerraformState): InfraResource[] {
  const seen = new Map<string, number>();

  return (state.resources ?? []).flatMap((resource) => {
    const instances = resource.instances?.length ? resource.instances : [{} as TerraformStateInstance];

    return instances.map((instance) => {
      const address = buildResourceAddress(resource, instance);
      const duplicateCount = seen.get(address) ?? 0;
      seen.set(address, duplicateCount + 1);
      const id = duplicateCount === 0 ? address : `${address}#${duplicateCount + 1}`;
      const attributes = instance.attributes ?? {};

      return {
        id,
        address,
        mode: resource.mode,
        provider: normalizeProvider(resource.provider),
        type: resource.type,
        name: resource.name,
        module: resource.module,
        indexKey: instance.index_key,
        attributes,
        dependencies: instance.dependencies ?? [],
        tags: extractTags(attributes),
      };
    });
  });
}

function looksLikeTerraformState(state: TerraformState): boolean {
  return (
    typeof state.version === 'number' ||
    typeof state.terraform_version === 'string' ||
    Array.isArray(state.resources) ||
    typeof state.outputs === 'object'
  );
}

function normalizeProvider(provider?: string): string | undefined {
  if (!provider) {
    return undefined;
  }

  const match = provider.match(/registry\.terraform\.io\/([^"]+)/);
  return match?.[1] ?? provider.replace(/^provider\["|"\]$/g, '');
}

function extractTags(attributes: Record<string, unknown>): Record<string, string> {
  const maps = ['tags', 'tags_all', 'labels']
    .map((key) => attributes[key])
    .filter(isRecord);

  return maps.reduce<Record<string, string>>((acc, value) => {
    for (const [key, tagValue] of Object.entries(value)) {
      if (typeof tagValue === 'string' || typeof tagValue === 'number' || typeof tagValue === 'boolean') {
        acc[key] = String(tagValue);
      }
    }
    return acc;
  }, {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
