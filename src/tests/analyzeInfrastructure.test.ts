import { describe, expect, it } from 'vitest';
import samplePlan from '../testdata/sample.plan.json';
import sampleState from '../testdata/sample.tfstate.json';
import { analyzeInfrastructure } from '../domain/report/analyzeInfrastructure';

describe('analyzeInfrastructure', () => {
  it('builds a sanitized state text report', () => {
    const report = analyzeInfrastructure([{ contents: JSON.stringify(sampleState) }], {
      mode: 'state',
      format: 'text',
      generatedAt: '2026-05-17T00:00:00.000Z',
    });

    expect(report.mode).toBe('state');
    expect(report.output).toContain('Resource 001');
    expect(report.output).toContain('aws_vpc');
    expect(report.output).not.toContain('aws_vpc.main');
    expect(report.output).not.toContain('sample.tfstate.json');
    expect(report.policy.failed).toBe(false);
  });

  it('builds a sanitized plan JSON report', () => {
    const report = analyzeInfrastructure([{ contents: JSON.stringify(samplePlan) }], {
      mode: 'plan',
      format: 'json',
      generatedAt: '2026-05-17T00:00:00.000Z',
    });

    expect(report.mode).toBe('plan');
    expect(report.output).toContain('"alias": "Change 001"');
    expect(report.output).not.toContain('module.app.aws_instance.app[0]');
    expect(report.output).not.toContain('old-secret-value');
    expect(report.output).not.toContain('new-secret-value');
    expect(report.output).not.toContain('instance_type');
  });

  it('builds a sanitized knowledge SVG report from multiple inputs', () => {
    const report = analyzeInfrastructure(
      [
        { contents: JSON.stringify(sampleState) },
        {
          contents:
            'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: platform\n  labels:\n    owner: platform-team\n',
        },
      ],
      {
        mode: 'knowledge',
        format: 'svg',
        generatedAt: '2026-05-17T00:00:00.000Z',
      },
    );

    expect(report.mode).toBe('knowledge');
    expect(report.output).toContain('Entity 001');
    expect(report.output).not.toContain('platform-team');
    expect(report.output).not.toContain('Input 001');
    expect(report.output).not.toContain('aws_vpc.main');
  });

  it('fails policy with exit-code-worthy status when warning threshold is met', () => {
    const report = analyzeInfrastructure([{ contents: JSON.stringify(samplePlan) }], {
      mode: 'plan',
      failOn: 'warning',
      generatedAt: '2026-05-17T00:00:00.000Z',
    });

    expect(report.policy.failed).toBe(true);
    expect(report.policy.reason).toContain('warning');
  });

  it('throws a generic unsupported-input error without leaking file names', () => {
    expect(() => analyzeInfrastructure([{ contents: 'not terraform' }], { mode: 'knowledge' })).toThrow(
      'No supported infrastructure entities were found.',
    );
  });
});
