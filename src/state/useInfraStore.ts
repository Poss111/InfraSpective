import { create } from 'zustand';
import type { Finding, FindingSeverity } from '../types/findings';
import type { InfraEdge, InfraResource } from '../types/infra';
import type { KnowledgeGraph } from '../types/knowledge';
import type { PlanAction, PlanEdge, PlanResourceChange, TerraformPlan } from '../types/plan';
import type { TerraformState } from '../types/terraform';
import type { KnowledgeFilters } from '../domain/filtering/filterKnowledgeGraph';
import { buildGraph } from '../domain/graph/buildGraph';
import { buildPlanGraph } from '../domain/graph/buildPlanGraph';
import { buildKnowledgeGraphFromFiles, type KnowledgeInputFile } from '../domain/knowledge/knowledgeGraph';
import { defaultKnowledgeFilters } from '../domain/filtering/filterKnowledgeGraph';
import { detectFindings } from '../domain/findings/detectFindings';
import { parseTerraformPlan, toPlanResourceChanges } from '../domain/terraform/parseTerraformPlan';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';
import { trackEvent } from '../analytics/googleAnalytics';

export type ModeFilter = 'all' | 'managed' | 'data';

export type InfraFilters = {
  search: string;
  provider: string;
  type: string;
  module: string;
  mode: ModeFilter;
  severity: 'all' | FindingSeverity;
  onlyWithFindings: boolean;
};

export type UploadMode = 'knowledge' | 'state' | 'plan';

export type PlanFilters = {
  search: string;
  action: 'all' | PlanAction;
  provider: string;
  type: string;
  module: string;
};

type InfraStore = {
  activeView?: UploadMode;
  state?: TerraformState;
  plan?: TerraformPlan;
  knowledgeGraph?: KnowledgeGraph;
  resources: InfraResource[];
  edges: InfraEdge[];
  findings: Finding[];
  planChanges: PlanResourceChange[];
  planEdges: PlanEdge[];
  selectedKnowledgeEntityId?: string;
  selectedResourceId?: string;
  selectedPlanChangeId?: string;
  error?: string;
  filters: InfraFilters;
  planFilters: PlanFilters;
  knowledgeFilters: KnowledgeFilters;
  loadKnowledgeFiles: (files: KnowledgeInputFile[]) => void;
  loadStateJson: (json: unknown) => void;
  loadPlanJson: (json: unknown) => void;
  clear: () => void;
  selectKnowledgeEntity: (id?: string) => void;
  selectResource: (id?: string) => void;
  selectPlanChange: (id?: string) => void;
  setKnowledgeFilter: <K extends keyof KnowledgeFilters>(key: K, value: KnowledgeFilters[K]) => void;
  setFilter: <K extends keyof InfraFilters>(key: K, value: InfraFilters[K]) => void;
  setPlanFilter: <K extends keyof PlanFilters>(key: K, value: PlanFilters[K]) => void;
};

const defaultFilters: InfraFilters = {
  search: '',
  provider: 'all',
  type: 'all',
  module: 'all',
  mode: 'all',
  severity: 'all',
  onlyWithFindings: false,
};

const defaultPlanFilters: PlanFilters = {
  search: '',
  action: 'all',
  provider: 'all',
  type: 'all',
  module: 'all',
};

export const useInfraStore = create<InfraStore>((set) => ({
  resources: [],
  edges: [],
  findings: [],
  planChanges: [],
  planEdges: [],
  filters: defaultFilters,
  planFilters: defaultPlanFilters,
  knowledgeFilters: defaultKnowledgeFilters,
  loadKnowledgeFiles: (files) => {
    try {
      const knowledgeGraph = buildKnowledgeGraphFromFiles(files);
      if (knowledgeGraph.entities.length === 0) {
        set({
          error: knowledgeGraph.warnings[0] ?? 'No supported infrastructure entities were found in these files.',
        });
        return;
      }

      trackEvent('knowledge_graph_parse_success', {
        source_count: knowledgeGraph.sources.length,
        entity_count: knowledgeGraph.entities.length,
        relationship_count: knowledgeGraph.relationships.length,
        insight_count: knowledgeGraph.insights.length,
      });

      set({
        activeView: 'knowledge',
        knowledgeGraph,
        state: undefined,
        plan: undefined,
        resources: [],
        edges: [],
        findings: [],
        planChanges: [],
        planEdges: [],
        selectedKnowledgeEntityId: knowledgeGraph.entities[0]?.id,
        selectedResourceId: undefined,
        selectedPlanChangeId: undefined,
        error: knowledgeGraph.warnings[0],
        filters: defaultFilters,
        planFilters: defaultPlanFilters,
        knowledgeFilters: defaultKnowledgeFilters,
      });
    } catch (error) {
      trackEvent('parse_error', { upload_mode: 'knowledge' });
      set({
        error: error instanceof Error ? error.message : 'Unable to build the infrastructure graph.',
      });
    }
  },
  loadStateJson: (json) => {
    try {
      const state = parseTerraformState(json);
      const resources = toInfraResources(state);
      const graph = buildGraph(resources);
      const findings = detectFindings(graph.nodes, graph.edges);
      const providers = new Set(resources.map((resource) => resource.provider).filter(Boolean)).size;
      const modules = new Set(resources.map((resource) => resource.module).filter(Boolean)).size;

      trackEvent('state_parse_success', {
        resource_count: graph.nodes.length,
        edge_count: graph.edges.length,
        finding_count: findings.length,
        provider_count: providers,
        module_count: modules,
      });

      set({
        activeView: 'state',
        knowledgeGraph: undefined,
        state,
        plan: undefined,
        resources: graph.nodes,
        edges: graph.edges,
        findings,
        planChanges: [],
        planEdges: [],
        selectedKnowledgeEntityId: undefined,
        selectedResourceId: graph.nodes[0]?.id,
        selectedPlanChangeId: undefined,
        error: undefined,
        filters: defaultFilters,
        planFilters: defaultPlanFilters,
        knowledgeFilters: defaultKnowledgeFilters,
      });
    } catch (error) {
      trackEvent('parse_error', { upload_mode: 'state' });
      set({
        error: error instanceof Error ? error.message : 'Unable to parse this state file.',
      });
    }
  },
  loadPlanJson: (json) => {
    try {
      const plan = parseTerraformPlan(json);
      const changes = toPlanResourceChanges(plan);
      const graph = buildPlanGraph(changes);
      trackEvent('plan_parse_success', {
        change_count: changes.length,
        create_count: changes.filter((change) => change.action === 'create').length,
        update_count: changes.filter((change) => change.action === 'update').length,
        delete_count: changes.filter((change) => change.action === 'delete').length,
        replace_count: changes.filter((change) => change.action === 'replace').length,
      });

      set({
        activeView: 'plan',
        knowledgeGraph: undefined,
        state: undefined,
        plan,
        resources: [],
        edges: [],
        findings: [],
        planChanges: graph.nodes,
        planEdges: graph.edges,
        selectedKnowledgeEntityId: undefined,
        selectedResourceId: undefined,
        selectedPlanChangeId: graph.nodes[0]?.id,
        error: undefined,
        filters: defaultFilters,
        planFilters: defaultPlanFilters,
        knowledgeFilters: defaultKnowledgeFilters,
      });
    } catch (error) {
      trackEvent('parse_error', { upload_mode: 'plan' });
      set({
        error: error instanceof Error ? error.message : 'Unable to parse this plan file.',
      });
    }
  },
  clear: () =>
    set({
      activeView: undefined,
      knowledgeGraph: undefined,
      state: undefined,
      plan: undefined,
      resources: [],
      edges: [],
      findings: [],
      planChanges: [],
      planEdges: [],
      selectedKnowledgeEntityId: undefined,
      selectedResourceId: undefined,
      selectedPlanChangeId: undefined,
      error: undefined,
      filters: defaultFilters,
      planFilters: defaultPlanFilters,
      knowledgeFilters: defaultKnowledgeFilters,
    }),
  selectKnowledgeEntity: (id) => set({ selectedKnowledgeEntityId: id }),
  selectResource: (id) => set({ selectedResourceId: id }),
  selectPlanChange: (id) => set({ selectedPlanChangeId: id }),
  setKnowledgeFilter: (key, value) => set((store) => ({ knowledgeFilters: { ...store.knowledgeFilters, [key]: value } })),
  setFilter: (key, value) => set((store) => ({ filters: { ...store.filters, [key]: value } })),
  setPlanFilter: (key, value) => set((store) => ({ planFilters: { ...store.planFilters, [key]: value } })),
}));
