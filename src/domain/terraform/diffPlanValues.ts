import type { PlanFieldDiff } from '../../types/plan';
import { isSensitiveKey, redactSensitiveValues } from '../redaction/redactSensitiveValues';

export function diffPlanValues(before: unknown, after: unknown): PlanFieldDiff[] {
  return diffValues(before, after);
}

function diffValues(before: unknown, after: unknown, path = '', key = ''): PlanFieldDiff[] {
  if (isRecord(before) && isRecord(after)) {
    if (isSensitiveKey(key)) {
      return Object.is(JSON.stringify(before), JSON.stringify(after))
        ? []
        : [{ path: path || '(root)', before: '[REDACTED]', after: '[REDACTED]' }];
    }

    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Array.from(keys).flatMap((nestedKey) => diffValues(before[nestedKey], after[nestedKey], joinPath(path, nestedKey), nestedKey));
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    return Array.from({ length }, (_, index) => index).flatMap((index) =>
      diffValues(before[index], after[index], `${path}[${index}]`, key),
    );
  }

  if (Object.is(before, after) || JSON.stringify(before) === JSON.stringify(after)) {
    return [];
  }

  return [
    {
      path: path || '(root)',
      before: redactLeaf(before, key),
      after: redactLeaf(after, key),
    },
  ];
}

function redactLeaf(value: unknown, key: string): unknown {
  return key && isSensitiveKey(key) ? '[REDACTED]' : redactSensitiveValues(value);
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
