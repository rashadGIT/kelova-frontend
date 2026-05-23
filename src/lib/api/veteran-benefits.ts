import { apiClient } from './client';
import type { IVeteranBenefitItem } from '@/types';

export async function initVeteranChecklist(caseId: string): Promise<IVeteranBenefitItem[]> {
  const res = await apiClient.post<IVeteranBenefitItem[]>(
    `/cases/${caseId}/veteran-benefits/init`,
  );
  return res.data;
}

export async function getVeteranChecklist(caseId: string): Promise<IVeteranBenefitItem[]> {
  const res = await apiClient.get<IVeteranBenefitItem[]>(
    `/cases/${caseId}/veteran-benefits`,
  );
  return res.data;
}

export async function updateVeteranBenefitItem(
  itemId: string,
  dto: { status?: IVeteranBenefitItem['status']; notes?: string; completedBy?: string },
): Promise<IVeteranBenefitItem> {
  const res = await apiClient.patch<IVeteranBenefitItem>(
    `/veteran-benefits/${itemId}`,
    dto,
  );
  return res.data;
}
