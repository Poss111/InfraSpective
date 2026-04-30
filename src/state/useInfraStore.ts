import { create } from 'zustand';
import type { Finding, FindingSeverity } from '../types/findings';
import type { InfraEdge, InfraResource } from '../types/infra';
import type { PlanAction, PlanEdge, PlanResourceChange, TerraformPlan } from '../types/plan';
import type { TerraformState } from '../types/terraform';
import { buildGraph } from '../domain/graph/buildGraph';
import { buildPlanGraph } from '../domain/graph/buildPlanGraph';
import { detectFindings } from '../domain/findings/detectFindings';
import { parseTerraformPlan, toPlanResourceChanges } from '../domain/terraform/parseTerraformPlan';
import { parseTerraformState, toInfraResources } from '../domain/terraform/parseTerraformState';

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

export type UploadMode = 'state' | 'plan';

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
  resources: InfraResource[];
  edges: InfraEdge[];
  findings: Finding[];
  planChanges: PlanResourceChange[];
  planEdges: PlanEdge[];
  selectedResourceId?: string;
  selectedPlanChangeId?: string;
  error?: string;
  filters: InfraFilters;
  planFilters: PlanFilters;
  loadStateJson: (json: unknown) => void;
  loadPlanJson: (json: unknown) => void;
  clear: () => void;
  selectResource: (id?: string) => void;
  selectPlanChange: (id?: string) => void;
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
  loadStateJson: (json) => {
    try {
      const state = parseTerraformState(json);
      const resources = toInfraResources(state);
      const graph = buildGraph(resources);
      const findings = detectFindings(graph.nodes, graph.edges);

      set({
        activeView: 'state',
        state,
        plan: undefined,
        resources: graph.nodes,
        edges: graph.edges,
        findings,
        planChanges: [],
        planEdges: [],
        selectedResourceId: graph.nodes[0]?.id,
        selectedPlanChangeId: undefined,
        error: undefined,
        filters: defaultFilters,
        planFilters: defaultPlanFilters,
      });
    } catch (error) {
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

      set({
        activeView: 'plan',
        state: undefined,
        plan,
        resources: [],
        edges: [],
        findings: [],
        planChanges: graph.nodes,
        planEdges: graph.edges,
        selectedResourceId: undefined,
        selectedPlanChangeId: graph.nodes[0]?.id,
        error: undefined,
        filters: defaultFilters,
        planFilters: defaultPlanFilters,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to parse this plan file.',
      });
    }
  },
  clear: () =>
    set({
      activeView: undefined,
      state: undefined,
      plan: undefined,
      resources: [],
      edges: [],
      findings: [],
      planChanges: [],
      planEdges: [],
      selectedResourceId: undefined,
      selectedPlanChangeId: undefined,
      error: undefined,
      filters: defaultFilters,
      planFilters: defaultPlanFilters,
    }),
  selectResource: (id) => set({ selectedResourceId: id }),
  selectPlanChange: (id) => set({ selectedPlanChangeId: id }),
  setFilter: (key, value) => set((store) => ({ filters: { ...store.filters, [key]: value } })),
  setPlanFilter: (key, value) => set((store) => ({ planFilters: { ...store.planFilters, [key]: value } })),
}));
