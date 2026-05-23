import { apiClient } from './client';
import type { IPayment } from '@/types';

export interface PaymentSummary {
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
}

export async function getCasePayments(caseId: string): Promise<IPayment | null> {
  const res = await apiClient.get<IPayment>(`/cases/${caseId}/payment`).catch((e) => {
    if (e?.response?.status === 404) return null;
    throw e;
  });
  return res ? res.data : null;
}

export async function recordPayment(caseId: string, dto: { amount: number; method: string; notes?: string }): Promise<IPayment> {
  const res = await apiClient.put<IPayment>(`/cases/${caseId}/payment`, dto);
  return res.data;
}

export async function createCheckoutSession(
  caseId: string,
  amountCents: number,
  description?: string,
): Promise<{ url: string }> {
  const res = await apiClient.post<{ url: string }>(
    `/cases/${caseId}/payments/checkout`,
    { amountCents, description },
  );
  return res.data;
}

export async function createRefund(
  caseId: string,
  amountCents?: number,
): Promise<{ success: boolean }> {
  const res = await apiClient.post<{ success: boolean }>(
    `/cases/${caseId}/payments/refund`,
    { amountCents },
  );
  return res.data;
}
