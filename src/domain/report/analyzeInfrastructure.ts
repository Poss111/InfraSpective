import { buildKnowledgeSafeExport, buildPlanSafeExport, buildStateSafeExport, makeSafeExportText, renderSafeExportSvg, type SafeExportSummary } from '../export/safeExport';
import { detectFindings } from '../findings/detectFindings';
import { buildGraph } from '../graph/buildGraph';
import { buildPlanGraph } from '../graph/buildPlanGraph';
import { buildKnowledgeGraphFromFiles } from '../knowledge/knowledgeGraph';
import { parseTerraformPlan, toPlanResourceChanges } from '../terraform/parseTerraformPlan';
import { parseTerraformState, toInfraResources } from '../terraform/parseTerraformState';

export type AnalyzeMode = 'auto' | 'state' | 'plan' | 'knowledge';
export type ReportFormat = 'text' | 'json' | 'svg';
export type FailOn = 'none' | 'warning' | 'critical';

export type AnalyzeInputFile = {
  contents: string;
};

export type AnalyzeOptions = {
  mode?: AnalyzeMode;
  format?: ReportFormat;
  failOn?: FailOn;
  generatedAt?: string;
};

export type AnalyzeReport = {
  mode: Exclude<AnalyzeMode, 'auto'>;
  format: ReportFormat;
  summary: SafeExportSummary;
  output: string;
  policy: {
    failed: boolean;
    reason?: string;
  };
};

export class InfrastructureAnalyzeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfrastructureAnalyzeError';
  }
}

export function analyzeInfrastructure(files: AnalyzeInputFile[], options: AnalyzeOptions = {}): AnalyzeReport {
  if (files.length === 0) {
    throw new InfrastructureAnalyzeError('At least one input file is required.');
  }

  const mode = options.mode ?? 'auto';
  const format = options.format ?? 'text';
  const failOn = options.failOn ?? 'none';
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const resolved = mode === 'auto' ? analyzeAuto(files, generatedAt) : analyzeWithMode(files, mode, generatedAt);
  const output = renderReport(resolved.summary, format);
  const policy = evaluatePolicy(resolved.summary, failOn);

  return {
    mode: resolved.mode,
    format,
    summary: resolved.summary,
    output,
    policy,
  };
}

function analyzeAuto(files: AnalyzeInputFile[], generatedAt: string): Pick<AnalyzeReport, 'mode' | 'summary'> {
  if (files.length > 1) {
    return analyzeKnowledge(files, generatedAt);
  }

  const [file] = files;
  const json = parseJson(file.contents);

  if (json !== undefined) {
    try {
      return analyzeStateJson(json, generatedAt);
    } catch {
      try {
        return analyzePlanJson(json, generatedAt);
      } catch {
        return analyzeKnowledge(files, generatedAt);
      }
    }
  }

  return analyzeKnowledge(files, generatedAt);
}

function analyzeWithMode(files: AnalyzeInputFile[], mode: Exclude<AnalyzeMode, 'auto'>, generatedAt: string): Pick<AnalyzeReport, 'mode' | 'summary'> {
  if (mode === 'state') {
    assertSingleFile(files, 'state');
    return analyzeStateJson(parseRequiredJson(files[0].contents, 'state'), generatedAt);
  }

  if (mode === 'plan') {
    assertSingleFile(files, 'plan');
    return analyzePlanJson(parseRequiredJson(files[0].contents, 'plan'), generatedAt);
  }

  return analyzeKnowledge(files, generatedAt);
}

function analyzeStateJson(json: unknown, generatedAt: string): Pick<AnalyzeReport, 'mode' | 'summary'> {
  const state = parseTerraformState(json);
  const resources = toInfraResources(state);
  const graph = buildGraph(resources);
  const findings = detectFindings(graph.nodes, graph.edges);
  return {
    mode: 'state',
    summary: buildStateSafeExport(graph.nodes, graph.edges, findings, generatedAt),
  };
}

function analyzePlanJson(json: unknown, generatedAt: string): Pick<AnalyzeReport, 'mode' | 'summary'> {
  const plan = parseTerraformPlan(json);
  const changes = toPlanResourceChanges(plan);
  const graph = buildPlanGraph(changes);
  return {
    mode: 'plan',
    summary: buildPlanSafeExport(graph.nodes, graph.edges, generatedAt),
  };
}

function analyzeKnowledge(files: AnalyzeInputFile[], generatedAt: string): Pick<AnalyzeReport, 'mode' | 'summary'> {
  const graph = buildKnowledgeGraphFromFiles(files.map((file, index) => ({ name: `Input ${String(index + 1).padStart(3, '0')}`, contents: file.contents })));

  if (graph.entities.length === 0) {
    throw new InfrastructureAnalyzeError('No supported infrastructure entities were found.');
  }

  return {
    mode: 'knowledge',
    summary: buildKnowledgeSafeExport(graph, generatedAt),
  };
}

function renderReport(summary: SafeExportSummary, format: ReportFormat): string {
  if (format === 'json') {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }

  if (format === 'svg') {
    return `${renderSafeExportSvg(summary)}\n`;
  }

  return makeSafeExportText(summary);
}

function evaluatePolicy(summary: SafeExportSummary, failOn: FailOn): AnalyzeReport['policy'] {
  if (failOn === 'none') {
    return { failed: false };
  }

  const criticalCount = (summary.totals.criticalFindings ?? 0) + (summary.totals.criticalInsights ?? 0);
  const warningCount =
    (summary.totals.warningFindings ?? 0) +
    (summary.totals.warningInsights ?? 0) +
    (summary.view === 'plan' ? (summary.totals.delete ?? 0) + (summary.totals.replace ?? 0) : 0);

  if (criticalCount > 0) {
    return { failed: true, reason: `${criticalCount} critical issue${criticalCount === 1 ? '' : 's'} found.` };
  }

  if (failOn === 'warning' && warningCount > 0) {
    return { failed: true, reason: `${warningCount} warning issue${warningCount === 1 ? '' : 's'} found.` };
  }

  return { failed: false };
}

function parseRequiredJson(contents: string, mode: 'state' | 'plan'): unknown {
  const parsed = parseJson(contents);
  if (parsed === undefined) {
    throw new InfrastructureAnalyzeError(`${mode} mode requires a JSON input file.`);
  }
  return parsed;
}

function parseJson(contents: string): unknown | undefined {
  try {
    return JSON.parse(contents);
  } catch {
    return undefined;
  }
}

function assertSingleFile(files: AnalyzeInputFile[], mode: 'state' | 'plan'): void {
  if (files.length !== 1) {
    throw new InfrastructureAnalyzeError(`${mode} mode accepts exactly one input file.`);
  }
}
