import { mkdirSync, writeFileSync } from 'node:fs';
import { appendFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const format = input('FORMAT', 'text');
const reportPath = resolve(process.env.INFRASPECTIVE_REPORT_PATH || `infraspective-report.${format === 'text' ? 'txt' : format}`);
const actionPath = process.env.GITHUB_ACTION_PATH || process.cwd();
const cliPath = resolve(actionPath, 'dist/cli/infraspective.js');
const files = input('FILES', '')
  .split(/[\n,]/)
  .map((value) => value.trim())
  .filter(Boolean);

if (files.length === 0) {
  console.error('The files input must include at least one path.');
  process.exit(1);
}

mkdirSync(dirname(reportPath), { recursive: true });

const args = [
  cliPath,
  'analyze',
  ...files,
  '--mode',
  input('MODE', 'auto'),
  '--format',
  format,
  '--fail-on',
  input('FAIL_ON', 'none'),
  '--out',
  reportPath,
];

const result = spawnSync(process.execPath, args, {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

await writeOutput('report-path', reportPath);

if (input('COMMENT', 'true') === 'true' && process.env.GITHUB_STEP_SUMMARY) {
  const report = await readFile(reportPath, 'utf8').catch(() => '');
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `## InfraSpective sanitized report\n\n${format === 'svg' ? `Report artifact: \`${reportPath}\`\n` : fencedReport(report, format)}\n`,
    'utf8',
  );
}

process.exit(result.status ?? 1);

function input(name, fallback) {
  const value = process.env[`INPUT_${name}`] ?? process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

async function writeOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, 'utf8');
    return;
  }
  writeFileSync(1, `${name}=${value}\n`);
}

function fencedReport(report, formatName) {
  const fence = formatName === 'json' ? 'json' : 'text';
  return `\`\`\`${fence}\n${report}\`\`\`\n`;
}
