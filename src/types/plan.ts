export type TerraformPlan = {
  format_version?: string;
  terraform_version?: string;
  resource_changes?: TerraformPlanResourceChange[];
};

export type TerraformPlanResourceChange = {
  address: string;
  mode?: 'managed' | 'data';
  type: string;
  name: string;
  provider_name?: string;
  module_address?: string;
  index?: string | number;
  change: {
    actions: string[];
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    after_unknown?: Record<string, unknown>;
  };
};

export type PlanAction = 'create' | 'update' | 'delete' | 'replace' | 'read' | 'no-op';

export type PlanFieldDiff = {
  path: string;
  before: unknown;
  after: unknown;
};

export type PlanResourceChange = {
  id: string;
  address: string;
  action: PlanAction;
  mode: 'managed' | 'data';
  provider?: string;
  type: string;
  name: string;
  module?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changedFields: PlanFieldDiff[];
};

export type PlanEdge = {
  id: string;
  source: string;
  target: string;
};
