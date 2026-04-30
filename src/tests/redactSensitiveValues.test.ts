import { describe, expect, it } from 'vitest';
import { redactSensitiveValues } from '../domain/redaction/redactSensitiveValues';

describe('redactSensitiveValues', () => {
  it('redacts sensitive keys recursively', () => {
    expect(
      redactSensitiveValues({
        username: 'admin',
        password: 'secret',
        nested: {
          api_token: 'token',
          public: 'ok',
        },
        certs: [{ private_key: 'key' }],
      }),
    ).toEqual({
      username: 'admin',
      password: '[REDACTED]',
      nested: {
        api_token: '[REDACTED]',
        public: 'ok',
      },
      certs: '[REDACTED]',
    });
  });
});
