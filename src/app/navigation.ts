import type { LucideIcon } from 'lucide-react';
import { Radar, Search, Crosshair, BarChart2, Archive, Cpu, Info } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { id: 'observatory', label: 'Observe', path: '/observatory', icon: Radar },
  { id: 'discovery', label: 'Discover', path: '/discover', icon: Search },
  { id: 'candidates', label: 'Candidates', path: '/candidates', icon: Crosshair },
  { id: 'analysis', label: 'Analysis', path: '/analysis/AET-04721', icon: BarChart2 },
  { id: 'archive', label: 'Archive', path: '/archive', icon: Archive },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: 'model', label: 'Method', path: '/model', icon: Cpu },
  { id: 'about', label: 'About', path: '/about', icon: Info },
];

export const PRIMARY_NAV = MAIN_NAV;
