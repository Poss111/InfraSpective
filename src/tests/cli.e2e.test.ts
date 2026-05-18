import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const cliPath = join(process.cwd(), 'dist', 'cli', 'infraspective.js');
const planPath = join(process.cwd(), 'src', 'testdata', 'sample.plan.json');
const statePath = join(process.cwd(), 'src', 'testdata', 'sample.tfstate.json');

describe('infraspective CLI e2e', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build:cli'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
  }, 60_000);

  it('prints a sanitized plan report to stdout', () => {
    const result = runCli(['analyze', planPath, '-m', 'plan', '-f', 'text']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('InfraSpective safe plan export');
    expect(result.stdout).toContain('Change 001');
    expect(result.stdout).toContain('aws_instance');
    expect(result.stdout).not.toContain('module.app.aws_instance.app[0]');
    expect(result.stdout).not.toContain('old-secret-value');
    expect(result.stdout).not.toContain('new-secret-value');
    expect(result.stdout).not.toContain('sample.plan.json');
    expect(result.stderr).toBe('');
  });

  it('shows a descriptive help screen with flags and examples', () => {
    const result = runCli(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Generate sanitized Terraform and infrastructure reports');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Arguments:');
    expect(result.stdout).toContain('-m, --mode <mode>');
    expect(result.stdout).toContain('-f, --format <format>');
    expect(result.stdout).toContain('-o, --out <path>');
    expect(result.stdout).toContain('-F, --fail-on <level>');
    expect(result.stdout).toContain('Examples:');
    expect(result.stderr).toBe('');
  });

  it('writes a sanitized state JSON report with --out', () => {
    const dir = mkdtempSync(join(tmpdir(), 'infraspective-cli-'));
    const outPath = join(dir, 'state-report.json');
    const result = runCli(['analyze', statePath, '--mode', 'state', '--format', 'json', '--out', outPath]);
    const output = readFileSync(outPath, 'utf8');

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(output).toContain('"view": "state"');
    expect(output).toContain('"alias": "Resource 001"');
    expect(output).not.toContain('aws_vpc.main');
    expect(output).not.toContain('sample-main-vpc');
    expect(output).not.toContain('sample.tfstate.json');
  });

  it('returns exit code 2 when fail-on warning policy is met', () => {
    const result = runCli(['analyze', planPath, '--mode', 'plan', '--fail-on', 'warning']);

    expect(result.status).toBe(2);
    expect(result.stdout).toContain('InfraSpective safe plan export');
    expect(result.stderr).toContain('warning issue');
    expect(result.stderr).not.toContain('module.app.aws_instance.app[0]');
  });

  it('returns exit code 1 for unsupported input without leaking the file path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'infraspective-cli-'));
    const unsupportedPath = join(dir, 'prod-secret-state.tfstate');
    writeFileSync(unsupportedPath, 'not terraform', 'utf8');

    const result = runCli(['analyze', unsupportedPath, '--mode', 'knowledge']);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('No supported infrastructure entities were found.');
    expect(result.stderr).not.toContain('prod-secret-state.tfstate');
  });

  it('renders a sanitized multi-file knowledge SVG report', () => {
    const dir = mkdtempSync(join(tmpdir(), 'infraspective-cli-'));
    const manifestPath = join(dir, 'platform-secret-manifest.yaml');
    writeFileSync(
      manifestPath,
      'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: platform\n  labels:\n    owner: platform-team\n',
      'utf8',
    );

    const result = runCli(['analyze', statePath, manifestPath, '--mode', 'knowledge', '--format', 'svg']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('<svg');
    expect(result.stdout).toContain('Entity 001');
    expect(result.stdout).not.toContain('platform-team');
    expect(result.stdout).not.toContain('platform-secret-manifest.yaml');
    expect(result.stdout).not.toContain('aws_vpc.main');
  });
});

function runCli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
