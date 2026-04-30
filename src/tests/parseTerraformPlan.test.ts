import { describe, expect, it } from 'vitest';
import samplePlan from '../testdata/sample.plan.json';
import { diffPlanValues } from '../domain/terraform/diffPlanValues';
import { detectPlanAction, parseTerraformPlan, toPlanResourceChanges } from '../domain/terraform/parseTerraformPlan';

describe('parseTerraformPlan', () => {
  it('parses and normalizes Terraform plan JSON', () => {
    const plan = parseTerraformPlan(samplePlan);
    const changes = toPlanResourceChanges(plan);

    expect(plan.format_version).toBe('1.2');
    expect(changes).toHaveLength(6);
    expect(changes.map((change) => change.action)).toEqual(['no-op', 'create', 'update', 'delete', 'replace', 'read']);
    expect(changes.find((change) => change.address === 'module.app.aws_instance.app[0]')?.provider).toBe('hashicorp/aws');
  });

  it('rejects unsupported plan shapes', () => {
    expect(() => parseTerraformPlan({ hello: 'world' })).toThrow(/missing Terraform plan markers/i);
    expect(() => parseTerraformPlan({ format_version: '1.2', resource_changes: [{ address: '' }] })).toThrow(
      /supported Terraform plan JSON/i,
    );
  });

  it('maps replace actions regardless of action order', () => {
    expect(detectPlanAction(['delete', 'create'])).toBe('replace');
    expect(detectPlanAction(['create', 'delete'])).toBe('replace');
    expect(detectPlanAction(['update'])).toBe('update');
  });

  it('produces nested redacted field diffs', () => {
    const diffs = diffPlanValues(
      { instance_type: 't3.micro', nested: { admin_password: 'old' } },
      { instance_type: 't3.small', nested: { admin_password: 'new' } },
    );

    expect(diffs).toContainEqual({ path: 'instance_type', before: 't3.micro', after: 't3.small' });
    expect(diffs).toContainEqual({ path: 'nested.admin_password', before: '[REDACTED]', after: '[REDACTED]' });
  });
});
