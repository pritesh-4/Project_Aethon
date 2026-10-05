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
  { id: 'observatory', index: '01', label: 'OBSERVATORY', path: '/observatory', icon: Radar },
  {
    id: 'discovery',
    index: '02',
    label: 'DISCOVERY',
    path: '/discover',
    icon: ScanSearch,
    badge: '4',
  },
  { id: 'candidates', index: '03', label: 'CANDIDATES', path: '/candidates', icon: Crosshair },
  {
    id: 'analysis',
    index: '04',
    label: 'ANALYSIS',
    path: '/analysis/AET-04721',
    icon: Activity,
  },
  { id: 'model', index: '05', label: 'MODEL', path: '/model', icon: BrainCircuit },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: 'archive', label: 'ARCHIVE', path: '/archive', icon: Database },
  { id: 'about', label: 'ABOUT', path: '/about', icon: Info },
  { id: 'mission', label: 'MISSION NARRATIVE', path: '/', icon: Disc },
];
