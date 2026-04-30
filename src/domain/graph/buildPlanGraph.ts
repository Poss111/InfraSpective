import type { PlanEdge, PlanResourceChange } from '../../types/plan';

export function buildPlanGraph(changes: PlanResourceChange[]): { nodes: PlanResourceChange[]; edges: PlanEdge[] } {
  return { nodes: changes, edges: [] };
}
