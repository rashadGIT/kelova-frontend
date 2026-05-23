import { apiClient } from './client';

export interface TaxSchedule {
  id: string;
  name: string;
  rate: number;
  appliesTo: string;
  cityState: string;
  effectiveDate: string;
  active: boolean;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  recipients: string;
  cadence: string;
  lastSent: string | null;
  active: boolean;
}

export interface PreneedCarrier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  apiType: string;
  active: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  active: boolean;
}

export async function getTaxSchedules(): Promise<TaxSchedule[]> {
  const res = await apiClient.get<TaxSchedule[]>('/settings/tax-schedules');
  return res.data;
}

export async function getScheduledReports(): Promise<ScheduledReport[]> {
  const res = await apiClient.get<ScheduledReport[]>('/settings/scheduled-reports');
  return res.data;
}

export async function getPreneedCarriers(): Promise<PreneedCarrier[]> {
  const res = await apiClient.get<PreneedCarrier[]>('/settings/preneed-carriers');
  return res.data;
}

export async function getAssets(): Promise<Asset[]> {
  const res = await apiClient.get<Asset[]>('/settings/assets');
  return res.data;
}
