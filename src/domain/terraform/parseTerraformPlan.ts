import type { PlanAction, PlanResourceChange, TerraformPlan } from '../../types/plan';
import { diffPlanValues } from './diffPlanValues';
import { terraformPlanSchema } from './terraformPlanSchema';

export class TerraformPlanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TerraformPlanParseError';
  }
}

export function parseTerraformPlan(json: unknown): TerraformPlan {
  const parsed = terraformPlanSchema.safeParse(json);
  if (!parsed.success) {
    throw new TerraformPlanParseError('This file does not look like supported Terraform plan JSON.');
  }

  if (!looksLikeTerraformPlan(parsed.data)) {
    throw new TerraformPlanParseError('This JSON is valid, but it is missing Terraform plan markers.');
  }

  return parsed.data;
}

export function toPlanResourceChanges(plan: TerraformPlan): PlanResourceChange[] {
  return (plan.resource_changes ?? []).map((resourceChange) => {
    const action = detectPlanAction(resourceChange.change.actions);
    const before = resourceChange.change.before;
    const after = resourceChange.change.after;

    return {
      id: resourceChange.address,
      address: resourceChange.address,
      action,
      mode: resourceChange.mode ?? 'managed',
      provider: normalizeProvider(resourceChange.provider_name),
      type: resourceChange.type,
      name: resourceChange.name,
      module: resourceChange.module_address,
      before,
      after,
      changedFields: action === 'update' || action === 'replace' ? diffPlanValues(before, after) : [],
    };
  });
}

export function detectPlanAction(actions: string[]): PlanAction {
  const normalized = new Set(actions);

  if (normalized.has('delete') && normalized.has('create')) return 'replace';
  if (normalized.has('create')) return 'create';
  if (normalized.has('update')) return 'update';
  if (normalized.has('delete')) return 'delete';
  if (normalized.has('read')) return 'read';
  return 'no-op';
}

function looksLikeTerraformPlan(plan: TerraformPlan): boolean {
  return (
    typeof plan.format_version === 'string' ||
    typeof plan.terraform_version === 'string' ||
    Array.isArray(plan.resource_changes)
  );
}

function normalizeProvider(provider?: string): string | undefined {
  if (!provider) {
    return undefined;
  }

  return provider.replace(/^registry\.terraform\.io\//, '');
}
