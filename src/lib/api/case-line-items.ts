import { apiClient } from './client';
import type { ICaseLineItem } from '@/types';

export async function getCaseLineItems(caseId: string): Promise<ICaseLineItem[]> {
  const res = await apiClient.get<ICaseLineItem[]>(`/cases/${caseId}/line-items`);
  return res.data;
}

export async function addCaseLineItem(
  caseId: string,
  dto: { priceListItemId: string; quantity?: number },
): Promise<ICaseLineItem> {
  const res = await apiClient.post<ICaseLineItem>(`/cases/${caseId}/line-items`, dto);
  return res.data;
}

export async function removeCaseLineItem(caseId: string, lineItemId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/line-items/${lineItemId}`);
}
