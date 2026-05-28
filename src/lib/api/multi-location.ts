import { apiClient } from './client';
import type { IMultiLocationSummary } from '@/types';

export async function getMultiLocationSummary(): Promise<IMultiLocationSummary> {
  const res = await apiClient.get<IMultiLocationSummary>('/multi-location/summary');
  return res.data;
}

export async function getGroupLocationSummary(
  ownerGroupId: string,
): Promise<IMultiLocationSummary> {
  const res = await apiClient.get<IMultiLocationSummary>(
    `/multi-location/groups/${ownerGroupId}/summary`,
  );
  return res.data;
}

// ─── Tenant search ────────────────────────────────────────────────────────

export interface TenantSearchResult {
  id: string;
  name: string;
  slug: string;
}

export async function searchTenants(q: string): Promise<TenantSearchResult[]> {
  const res = await apiClient.get<TenantSearchResult[]>('/multi-location/search', {
    params: { q },
  });
  return res.data;
}

// ─── Invites ─────────────────────────────────────────────────────────────

export interface LocationInvite {
  id: string;
  fromTenantId: string;
  toTenantId: string;
  displayName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  fromTenant?: { id: string; name: string; slug: string };
  toTenant?: { id: string; name: string; slug: string };
}

export async function sendInvite(
  toTenantId: string,
  displayName: string,
  expiresInDays = 7,
): Promise<LocationInvite> {
  const res = await apiClient.post<LocationInvite>('/multi-location/invites', {
    toTenantId,
    displayName,
    expiresInDays,
  });
  return res.data;
}

export async function getIncomingInvites(): Promise<LocationInvite[]> {
  const res = await apiClient.get<LocationInvite[]>('/multi-location/invites/incoming');
  return res.data;
}

export async function getOutgoingInvites(): Promise<LocationInvite[]> {
  const res = await apiClient.get<LocationInvite[]>('/multi-location/invites/outgoing');
  return res.data;
}

export async function acceptInvite(id: string): Promise<void> {
  await apiClient.post(`/multi-location/invites/${id}/accept`);
}

export async function rejectInvite(id: string): Promise<void> {
  await apiClient.post(`/multi-location/invites/${id}/reject`);
}

export async function cancelInvite(id: string): Promise<void> {
  await apiClient.delete(`/multi-location/invites/${id}`);
}

export async function leaveGroup(): Promise<void> {
  await apiClient.post('/multi-location/leave');
}
