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
