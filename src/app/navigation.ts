import type { LucideIcon } from 'lucide-react';
import {
  Radar,
  ScanSearch,
  Crosshair,
  Activity,
  BrainCircuit,
  Database,
  Info,
  Disc,
} from 'lucide-react';

export interface NavItem {
  id: string;
  index?: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { id: 'observatory', index: '01', label: 'Observatory', path: '/observatory', icon: Radar },
  {
    id: 'discovery',
    index: '02',
    label: 'Discovery',
    path: '/discover',
    icon: ScanSearch,
    badge: '4',
  },
  { id: 'candidates', index: '03', label: 'Candidates', path: '/candidates', icon: Crosshair },
  {
    id: 'analysis',
    index: '04',
    label: 'Analysis',
    path: '/analysis/AET-04721',
    icon: Activity,
  },
  { id: 'model', index: '05', label: 'Model', path: '/model', icon: BrainCircuit },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: 'archive', label: 'Archive', path: '/archive', icon: Database },
  { id: 'about', label: 'About', path: '/about', icon: Info },
  { id: 'mission', label: 'Overview', path: '/', icon: Disc },
];
