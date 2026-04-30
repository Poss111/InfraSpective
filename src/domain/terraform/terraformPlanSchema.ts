import { z } from 'zod';

export const terraformPlanResourceChangeSchema = z
  .object({
    address: z.string().min(1),
    mode: z.enum(['managed', 'data']).optional(),
    type: z.string().min(1),
    name: z.string().min(1),
    provider_name: z.string().optional(),
    module_address: z.string().optional(),
    index: z.union([z.string(), z.number()]).optional(),
    change: z
      .object({
        actions: z.array(z.string()),
        before: z.record(z.unknown()).nullable().optional(),
        after: z.record(z.unknown()).nullable().optional(),
        after_unknown: z.record(z.unknown()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const terraformPlanSchema = z
  .object({
    format_version: z.string().optional(),
    terraform_version: z.string().optional(),
    resource_changes: z.array(terraformPlanResourceChangeSchema).optional(),
  })
  .passthrough();
