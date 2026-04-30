import { z } from 'zod';

export const terraformStateInstanceSchema = z
  .object({
    index_key: z.union([z.string(), z.number()]).optional(),
    schema_version: z.number().optional(),
    attributes: z.record(z.unknown()).optional(),
    sensitive_attributes: z.array(z.unknown()).optional(),
    dependencies: z.array(z.string()).optional(),
  })
  .passthrough();

export const terraformStateResourceSchema = z
  .object({
    mode: z.enum(['managed', 'data']),
    type: z.string().min(1),
    name: z.string().min(1),
    provider: z.string().optional(),
    module: z.string().optional(),
    instances: z.array(terraformStateInstanceSchema).optional(),
  })
  .passthrough();

export const terraformStateSchema = z
  .object({
    version: z.number().optional(),
    terraform_version: z.string().optional(),
    serial: z.number().optional(),
    lineage: z.string().optional(),
    outputs: z.record(z.unknown()).optional(),
    resources: z.array(terraformStateResourceSchema).optional(),
  })
  .passthrough();
