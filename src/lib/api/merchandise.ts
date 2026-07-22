import { apiClient } from './client';

export type MerchandiseCategory =
  | 'casket'
  | 'urn'
  | 'vault'
  | 'clothing'
  | 'flowers'
  | 'stationery'
  | 'other';

export interface MerchandiseItem {
  id: string;
  name: string;
  category: MerchandiseCategory;
  priceRetail: number;
  priceCost?: number;
  sku?: string;
  description?: string;
  inStock: boolean;
  photoUrls?: string[];
  createdAt: string;
}

export interface CreateMerchandiseDto {
  name: string;
  category: MerchandiseCategory;
  priceRetail: number;
  priceCost?: number;
  sku?: string;
  description?: string;
}

export interface CaseMerchandiseSelection {
  id: string;
  caseId: string;
  item: MerchandiseItem;
  quantity: number;
  /** Price snapshotted when this item was added to the case — use this for
   * totals, not item.priceRetail, which reflects today's catalog price and
   * can drift after the fact. */
  priceAtTime: number;
  notes?: string;
}

export async function getMerchandise(params?: {
  category?: MerchandiseCategory;
  inStock?: boolean;
}): Promise<MerchandiseItem[]> {
  const res = await apiClient.get<MerchandiseItem[]>('/merchandise', { params });
  return res.data;
}

export async function createMerchandise(dto: CreateMerchandiseDto): Promise<MerchandiseItem> {
  const res = await apiClient.post<MerchandiseItem>('/merchandise', dto);
  return res.data;
}

export async function updateMerchandise(
  id: string,
  dto: Partial<CreateMerchandiseDto & { inStock: boolean }>,
): Promise<MerchandiseItem> {
  const res = await apiClient.patch<MerchandiseItem>(`/merchandise/${id}`, dto);
  return res.data;
}

export async function deleteMerchandise(id: string): Promise<void> {
  await apiClient.delete(`/merchandise/${id}`);
}

export async function getCaseMerchandise(caseId: string): Promise<CaseMerchandiseSelection[]> {
  const res = await apiClient.get<CaseMerchandiseSelection[]>(`/cases/${caseId}/merchandise`);
  return res.data;
}

export async function addCaseMerchandise(
  caseId: string,
  dto: { itemId: string; quantity: number; notes?: string },
): Promise<CaseMerchandiseSelection> {
  const res = await apiClient.post<CaseMerchandiseSelection>(`/cases/${caseId}/merchandise`, dto);
  return res.data;
}

export async function removeCaseMerchandise(
  caseId: string,
  selectionId: string,
): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/merchandise/${selectionId}`);
}
