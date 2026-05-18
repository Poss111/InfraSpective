import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('github-action script', () => {
  it('maps action inputs to CLI arguments and report output', () => {
    const root = mkdtempSync(join(tmpdir(), 'infraspective-action-'));
    const actionPath = join(root, 'action');
    const workspace = join(root, 'workspace');
    const cliDir = join(actionPath, 'dist', 'cli');
    const reportPath = join(root, 'report.txt');
    const outputPath = join(root, 'github-output.txt');
    mkdirSync(cliDir, { recursive: true });
    mkdirSync(workspace, { recursive: true });
    writeFileSync(join(workspace, 'plan.json'), '{}');
    const argsPathLiteral = join(root, 'args.json').replace(/\\/g, '\\\\');
    writeFileSync(
      join(cliDir, 'infraspective.js'),
      `const { writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
writeFileSync('${argsPathLiteral}', JSON.stringify(args));
writeFileSync(args[args.indexOf('--out') + 1], 'sanitized report');
`,
    );

    execFileSync('node', [join(process.cwd(), 'scripts/github-action.mjs')], {
      cwd: workspace,
      env: {
        ...process.env,
        GITHUB_ACTION_PATH: actionPath,
        GITHUB_OUTPUT: outputPath,
        INPUT_FILES: 'plan.json',
        INPUT_MODE: 'plan',
        INPUT_FORMAT: 'text',
        INPUT_FAIL_ON: 'none',
        INPUT_COMMENT: 'false',
        INFRASPECTIVE_REPORT_PATH: reportPath,
      },
    });

    const args = JSON.parse(readFileSync(join(root, 'args.json'), 'utf8')) as string[];
    expect(args).toEqual(['analyze', 'plan.json', '--mode', 'plan', '--format', 'text', '--fail-on', 'none', '--out', reportPath]);
    expect(readFileSync(reportPath, 'utf8')).toBe('sanitized report');
    expect(readFileSync(outputPath, 'utf8')).toContain(`report-path=${reportPath}`);
  });
});
