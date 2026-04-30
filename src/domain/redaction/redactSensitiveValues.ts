const SENSITIVE_KEY_PARTS = ['password', 'passwd', 'secret', 'token', 'key', 'private', 'credential', 'cert'];

export function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

export function redactSensitiveValues(value: unknown, parentKey = ''): unknown {
  if (parentKey && isSensitiveKey(parentKey)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValues(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, redactSensitiveValues(nestedValue, key)]),
    );
  }

  return value;
}
