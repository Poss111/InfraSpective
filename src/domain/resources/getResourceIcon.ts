import {
  Archive,
  Box,
  Cloud,
  Container,
  Cpu,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Network,
  Route,
  Router,
  Search,
  Server,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export function getResourceIcon(resource: { mode: 'managed' | 'data'; type: string }): LucideIcon {
  if (resource.mode === 'data') {
    return Search;
  }

  const type = resource.type.toLowerCase();

  if (type.includes('vpc') || type.includes('network')) return Network;
  if (type.includes('subnet') || type.includes('route')) return Route;
  if (type.includes('internet_gateway') || type.includes('nat_gateway') || type.includes('gateway')) return Router;
  if (type.includes('security_group') || type.includes('firewall') || type.includes('waf')) return Shield;
  if (type.includes('iam') || type.includes('role') || type.includes('policy')) return KeyRound;
  if (type.includes('kms') || type.includes('secret')) return Lock;
  if (type.includes('instance') || type.includes('server') || type.includes('compute')) return Server;
  if (type.includes('lambda') || type.includes('function')) return Cpu;
  if (type.includes('lb') || type.includes('load_balancer') || type.includes('dns') || type.includes('route53')) return Globe;
  if (type.includes('s3') || type.includes('bucket') || type.includes('storage')) return Archive;
  if (type.includes('db') || type.includes('database') || type.includes('rds') || type.includes('dynamodb')) return Database;
  if (type.includes('volume') || type.includes('disk') || type.includes('ebs')) return HardDrive;
  if (type.includes('container') || type.includes('ecs') || type.includes('ecr')) return Container;
  if (type.includes('module') || type.includes('stack')) return Layers;
  if (type.includes('cloud')) return Cloud;

  return Box;
}
