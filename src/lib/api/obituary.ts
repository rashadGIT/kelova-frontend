import axios from 'axios';
import { apiClient } from './client';
import type { IObituary, IObituaryContent } from '@/types';

export type ObituaryTone = 'formal' | 'warm' | 'religious';
export type ObituaryLength = 'short' | 'traditional' | 'detailed';

export interface GenerateObituaryOptions {
  tone?: ObituaryTone;
  length?: ObituaryLength;
}

export async function getObituary(caseId: string): Promise<IObituary | null> {
  try {
    const res = await apiClient.get<IObituary>(`/cases/${caseId}/obituary`);
    return res.data;
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null;
    throw e;
  }
}

export async function generateObituary(
  caseId: string,
  options: GenerateObituaryOptions = {},
): Promise<IObituary> {
  const res = await apiClient.post<IObituary>(
    `/cases/${caseId}/obituary/generate`,
    options,
  );
  return res.data;
}

export async function updateObituary(
  caseId: string,
  data: { content: IObituaryContent; status?: string },
): Promise<IObituary> {
  const res = await apiClient.patch<IObituary>(`/cases/${caseId}/obituary`, data);
  return res.data;
}

export interface IObituaryRevision {
  id: string;
  tenantId: string;
  obituaryId: string;
  content: IObituaryContent;
  status: string;
  source: 'ai_generated' | 'manual_edit' | 'restored';
  createdById: string | null;
  createdAt: string;
}

export async function listRevisions(caseId: string): Promise<IObituaryRevision[]> {
  const res = await apiClient.get<IObituaryRevision[]>(
    `/cases/${caseId}/obituary/revisions`,
  );
  return res.data;
}

export async function restoreRevision(
  caseId: string,
  revisionId: string,
): Promise<IObituary> {
  const res = await apiClient.post<IObituary>(
    `/cases/${caseId}/obituary/revisions/${revisionId}/restore`,
  );
  return res.data;
}

export async function shareObituaryWithFamily(caseId: string): Promise<IObituary> {
  const res = await apiClient.post<IObituary>(`/cases/${caseId}/obituary/share`);
  return res.data;
}
