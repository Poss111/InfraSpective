export type FindingSeverity = 'info' | 'warning' | 'critical';

export type Finding = {
  id: string;
  resourceId?: string;
  severity: FindingSeverity;
  category: 'security' | 'hygiene' | 'structure' | 'metadata';
  title: string;
  description: string;
};
