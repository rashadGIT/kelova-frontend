import { apiClient } from './client';
import type { IPayment } from '@/types';

export interface PaymentSummary {
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
}

export interface ArAgingCase {
  caseId: string;
  deceasedName: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  oldestUnpaidDays: number;
}

export interface ArAgingBucket {
  label: '0-30' | '31-60' | '61-90' | '90+';
  totalOutstanding: number;
  caseCount: number;
  cases: ArAgingCase[];
}

export interface ArAgingReport {
  buckets: ArAgingBucket[];
  totalOutstanding: number;
}

export async function getArAging(): Promise<ArAgingReport> {
  const res = await apiClient.get<ArAgingReport>('/accounting/ar-aging');
  return res.data;
}

export async function reconcilePayment(caseId: string): Promise<void> {
  await apiClient.patch(`/cases/${caseId}/payments/reconcile`);
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
