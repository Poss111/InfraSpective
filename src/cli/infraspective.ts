#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzeInfrastructure, type AnalyzeMode, type FailOn, type ReportFormat } from '../domain/report/analyzeInfrastructure';

type CliOptions = {
  command?: string;
  files: string[];
  mode: AnalyzeMode;
  format: ReportFormat;
  failOn: FailOn;
  out?: string;
  help: boolean;
};

const validModes = new Set<AnalyzeMode>(['auto', 'state', 'plan', 'knowledge']);
const validFormats = new Set<ReportFormat>(['text', 'json', 'svg']);
const validFailOn = new Set<FailOn>(['none', 'warning', 'critical']);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : 'InfraSpective analysis failed.');
    process.exitCode = 1;
  });
}

export async function main(argv: string[]): Promise<void> {
  const options = parseCliArgs(argv);

  if (options.help) {
    console.log(helpText());
    return;
  }

  if (options.command !== 'analyze') {
    throw new Error('Expected command: infraspective analyze <file...>');
  }

  if (options.files.length === 0) {
    throw new Error('At least one input file is required.');
  }

  const files = await Promise.all(
    options.files.map(async (file) => ({
      contents: await readFile(file, 'utf8').catch(() => {
        throw new Error('Unable to read one of the input files.');
      }),
    })),
  );

  const report = analyzeInfrastructure(files, {
    mode: options.mode,
    format: options.format,
    failOn: options.failOn,
  });

  if (options.out) {
    await mkdir(dirname(options.out), { recursive: true });
    await writeFile(options.out, report.output, 'utf8');
  } else {
    process.stdout.write(report.output);
  }

  if (report.policy.failed) {
    if (report.policy.reason) {
      console.error(report.policy.reason);
    }
    process.exitCode = 2;
  }
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    command: argv[0],
    files: [],
    mode: 'auto',
    format: 'text',
    failOn: 'none',
    help: false,
  };

  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    options.help = true;
    return options;
  }

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--mode' || arg === '-m') {
      options.mode = readEnum(argv, (index += 1), validModes, 'mode');
      continue;
    }

    if (arg === '--format' || arg === '-f') {
      options.format = readEnum(argv, (index += 1), validFormats, 'format');
      continue;
    }

    if (arg === '--fail-on' || arg === '-F') {
      options.failOn = readEnum(argv, (index += 1), validFailOn, 'fail-on');
      continue;
    }

    if (arg === '--out' || arg === '-o') {
      options.out = readValue(argv, (index += 1), 'out');
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.files.push(arg);
  }

  return options;
}

function readEnum<T extends string>(argv: string[], index: number, values: Set<T>, name: string): T {
  const value = readValue(argv, index, name);
  if (!values.has(value as T)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return value as T;
}

function readValue(argv: string[], index: number, name: string): string {
  const value = argv[index];
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for --${name}.`);
  }
  return value;
}

function helpText(): string {
  return `InfraSpective CLI

Generate sanitized Terraform and infrastructure reports from your terminal or CI.
InfraSpective parses files locally and emits safe summaries with generated aliases.
Reports omit file names, Terraform addresses, raw attributes, diffs, and secret-looking values.

Usage:
  infraspective analyze <file...> [options]
  infraspective --help

Commands:
  analyze <file...>             Analyze one or more local infrastructure files.

Arguments:
  <file...>                     One or more input files.
                                State and plan modes accept one JSON file.
                                Knowledge mode accepts multiple Terraform JSON,
                                Kubernetes YAML, or Helm-rendered manifest files.

Options:
  -m, --mode <mode>             Input mode: auto, state, plan, knowledge.
                                Default: auto
  -f, --format <format>         Output format: text, json, svg.
                                Default: text
  -o, --out <path>              Write the report to a file instead of stdout.
  -F, --fail-on <level>         Set policy failure threshold: none, warning, critical.
                                Default: none
  -h, --help                    Show this help screen.

Exit codes:
  0                             Analysis completed.
  1                             Input, parse, or runtime error.
  2                             Analysis completed, but --fail-on policy failed.

Examples:
  infraspective analyze terraform.tfstate
  infraspective analyze plan.json -m plan -f text
  infraspective analyze plan.json -m plan -f json -o infraspective-report.json
  infraspective analyze terraform.tfstate plan.json manifests.yaml -m knowledge -f svg -o graph.svg
  infraspective analyze plan.json -m plan -F warning
`;
}
