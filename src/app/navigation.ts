import type { LucideIcon } from 'lucide-react';
import { Radar, Search, Crosshair, BarChart2, Cpu, Archive, Info } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { id: 'observatory', label: 'Observatory', path: '/observatory', icon: Radar },
  { id: 'discovery', label: 'Discovery', path: '/discover', icon: Search },
  { id: 'candidates', label: 'Candidates', path: '/candidates', icon: Crosshair },
  { id: 'analysis', label: 'Analysis', path: '/analysis/AET-04721', icon: BarChart2 },
  { id: 'model', label: 'Model', path: '/model', icon: Cpu },
  { id: 'archive', label: 'Archive', path: '/archive', icon: Archive },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: 'about', label: 'About', path: '/about', icon: Info },
];

// Alias for backwards compatibility
export const PRIMARY_NAV = MAIN_NAV;
