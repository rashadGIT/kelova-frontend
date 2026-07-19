import { apiClient } from './client';
import type { IPaymentPlan, IPaymentInstallment } from '@/types';

export interface CreatePaymentPlanDto {
  downPayment: number;
  numberOfInstallments: number;
  frequencyDays: number;
  startDate: string;
}

export async function getPaymentPlan(caseId: string): Promise<IPaymentPlan | null> {
  const res = await apiClient
    .get<IPaymentPlan>(`/cases/${caseId}/payment-plan`)
    .catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });
  return res ? res.data : null;
}

export async function createPaymentPlan(
  caseId: string,
  dto: CreatePaymentPlanDto,
): Promise<IPaymentPlan> {
  const res = await apiClient.post<IPaymentPlan>(`/cases/${caseId}/payment-plan`, dto);
  return res.data;
}

export async function recordInstallmentPayment(
  installmentId: string,
  dto: { paidAmount: number; paymentMethod?: string; notes?: string },
): Promise<IPaymentInstallment> {
  const res = await apiClient.post<IPaymentInstallment>(
    `/payment-plans/installments/${installmentId}/pay`,
    dto,
  );
  return res.data;
}

export async function updatePaymentPlanStatus(
  planId: string,
  status: 'active' | 'completed' | 'defaulted' | 'cancelled',
): Promise<IPaymentPlan> {
  const res = await apiClient.patch<IPaymentPlan>(`/payment-plans/${planId}/status`, {
    status,
  });
  return res.data;
}
