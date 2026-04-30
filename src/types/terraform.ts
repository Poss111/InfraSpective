export type TerraformState = {
  version?: number;
  terraform_version?: string;
  serial?: number;
  lineage?: string;
  outputs?: Record<string, unknown>;
  resources?: TerraformStateResource[];
};

export type TerraformStateResource = {
  mode: 'managed' | 'data';
  type: string;
  name: string;
  provider?: string;
  module?: string;
  instances?: TerraformStateInstance[];
};

export type TerraformStateInstance = {
  index_key?: string | number;
  schema_version?: number;
  attributes?: Record<string, unknown>;
  sensitive_attributes?: unknown[];
  dependencies?: string[];
};
