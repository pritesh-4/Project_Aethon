export * from './schemas.ts';

export interface NavItem {
  name: string;
  href: string;
  badge?: string;
  description?: string;
  iconName?: string;
}

export interface TelemetryState {
  status: 'ONLINE' | 'STANDBY' | 'CALIBRATING' | 'OFFLINE';
  frequencyBand: string;
  samplingRate: string;
  activeTelescope: string;
  candidatesCount: number;
  snrThresholdDb: number;
}
