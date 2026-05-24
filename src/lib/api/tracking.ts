import { apiClient } from './client';

export const TRACKING_STATUSES = [
  'pending_pickup',
  'in_transit',
  'at_facility',
  'in_preparation',
  'ready',
  'at_service',
  'at_disposition',
  'complete',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export interface TrackingLogEntry {
  status: TrackingStatus;
  location?: string;
  note?: string;
  scannedBy: string;
  scannedAt: string;
}

export interface DecedentTracking {
  id: string;
  caseId: string;
  status: TrackingStatus;
  location: string | null;
  updatedBy: string | null;
  trackingLog: TrackingLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export async function getCaseTracking(caseId: string): Promise<DecedentTracking> {
  const res = await apiClient.get<DecedentTracking>(`/cases/${caseId}/tracking`);
  return res.data;
}

export async function getTrackingQrCode(caseId: string): Promise<{ dataUrl: string }> {
  const res = await apiClient.get<{ dataUrl: string }>(`/cases/${caseId}/tracking/qr`);
  return res.data;
}

export async function scanUpdate(
  caseId: string,
  dto: { status: TrackingStatus; location?: string; note?: string },
): Promise<DecedentTracking> {
  const res = await apiClient.post<DecedentTracking>(`/cases/${caseId}/tracking/scan`, dto);
  return res.data;
}

export const STATUS_LABELS: Record<TrackingStatus, string> = {
  pending_pickup: 'Pending Pickup',
  in_transit: 'In Transit',
  at_facility: 'At Facility',
  in_preparation: 'In Preparation',
  ready: 'Ready',
  at_service: 'At Service',
  at_disposition: 'At Disposition',
  complete: 'Complete',
};
