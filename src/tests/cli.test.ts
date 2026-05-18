import { describe, expect, it } from 'vitest';
import { parseCliArgs } from '../cli/infraspective';

describe('infraspective CLI', () => {
  it('parses analyze options and files', () => {
    const options = parseCliArgs([
      'analyze',
      'plan.json',
      '--mode',
      'plan',
      '--format',
      'json',
      '--fail-on',
      'warning',
      '--out',
      'report.json',
    ]);

    expect(options).toMatchObject({
      command: 'analyze',
      files: ['plan.json'],
      mode: 'plan',
      format: 'json',
      failOn: 'warning',
      out: 'report.json',
    });
  });

  it('parses shorthand flags', () => {
    const options = parseCliArgs(['analyze', 'plan.json', '-m', 'plan', '-f', 'svg', '-F', 'critical', '-o', 'graph.svg']);

    expect(options).toMatchObject({
      command: 'analyze',
      files: ['plan.json'],
      mode: 'plan',
      format: 'svg',
      failOn: 'critical',
      out: 'graph.svg',
    });
  });

  it('rejects unknown options', () => {
    expect(() => parseCliArgs(['analyze', 'plan.json', '--raw'])).toThrow('Unknown option: --raw');
  });
});
