export type InfraResource = {
  id: string;
  address: string;
  mode: 'managed' | 'data';
  provider?: string;
  type: string;
  name: string;
  module?: string;
  indexKey?: string | number;
  attributes: Record<string, unknown>;
  dependencies: string[];
  tags: Record<string, string>;
};

export type InfraEdge = {
  id: string;
  source: string;
  target: string;
  reason: 'explicit_dependency' | 'module_relationship' | 'unknown';
};

export type InfraGraph = {
  nodes: InfraResource[];
  edges: InfraEdge[];
};
