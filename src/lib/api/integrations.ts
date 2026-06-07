import { apiClient } from './client';

export interface QBStatus {
  connected: boolean;
  connectedAt: string | null;
  syncEnabled: boolean;
}

export async function getQBAuthUrl(): Promise<string> {
  const res = await apiClient.get<{ url: string }>('/integrations/quickbooks/auth-url');
  return res.data.url;
}

export async function getQBStatus(): Promise<QBStatus> {
  const res = await apiClient.get<QBStatus>('/integrations/quickbooks/status');
  return res.data;
}

export async function disconnectQB(): Promise<void> {
  await apiClient.delete('/integrations/quickbooks/disconnect');
}

export async function syncQBInvoice(caseId: string): Promise<void> {
  await apiClient.post(`/integrations/quickbooks/sync/invoice/${caseId}`);
}

export async function syncQBPayment(caseId: string): Promise<void> {
  await apiClient.post(`/integrations/quickbooks/sync/payment/${caseId}`);
}

export async function syncQBCustomer(contactId: string): Promise<void> {
  await apiClient.post(`/integrations/quickbooks/sync/customer/${contactId}`);
}
