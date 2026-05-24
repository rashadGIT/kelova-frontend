import { apiClient } from './client';

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKeyRecord {
  key: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  lastDeliveredAt: string | null;
  createdAt: string;
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const res = await apiClient.get<ApiKeyRecord[]>('/api-keys');
  return res.data;
}

export async function createApiKey(dto: {
  name: string;
  scopes?: string[];
  expiresAt?: string;
}): Promise<CreatedApiKey> {
  const res = await apiClient.post<CreatedApiKey>('/api-keys', dto);
  return res.data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/api-keys/${id}`);
}

export async function listWebhooks(): Promise<WebhookSubscription[]> {
  const res = await apiClient.get<WebhookSubscription[]>('/webhooks');
  return res.data;
}

export async function createWebhook(dto: {
  url: string;
  events: string[];
}): Promise<WebhookSubscription> {
  const res = await apiClient.post<WebhookSubscription>('/webhooks', dto);
  return res.data;
}

export async function deleteWebhook(id: string): Promise<void> {
  await apiClient.delete(`/webhooks/${id}`);
}

export async function getSupportedWebhookEvents(): Promise<{ events: string[] }> {
  const res = await apiClient.get<{ events: string[] }>('/webhooks/events');
  return res.data;
}
