import type { TerraformStateInstance, TerraformStateResource } from '../../types/terraform';

export function buildResourceAddress(
  resource: TerraformStateResource,
  instance?: TerraformStateInstance,
): string {
  const resourcePart =
    resource.mode === 'data' ? `data.${resource.type}.${resource.name}` : `${resource.type}.${resource.name}`;
  const base = [resource.module, resourcePart].filter(Boolean).join('.');
  if (instance?.index_key === undefined || instance.index_key === null) {
    return base;
  }

  const index =
    typeof instance.index_key === 'number'
      ? String(instance.index_key)
      : JSON.stringify(instance.index_key);

  return `${base}[${index}]`;
}
