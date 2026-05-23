import { apiClient } from './client';
import type { IObituarySubmission } from '@/types';

export interface SubmitObituaryDto {
  outlet: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

export async function submitObituary(
  obituaryId: string,
  dto: SubmitObituaryDto,
): Promise<IObituarySubmission> {
  const res = await apiClient.post<IObituarySubmission>(
    `/obituaries/${obituaryId}/submissions`,
    dto,
  );
  return res.data;
}

export async function getSubmissionsByObituary(
  obituaryId: string,
): Promise<IObituarySubmission[]> {
  const res = await apiClient.get<IObituarySubmission[]>(
    `/obituaries/${obituaryId}/submissions`,
  );
  return res.data;
}

export async function getSubmissionsByCase(caseId: string): Promise<IObituarySubmission[]> {
  const res = await apiClient.get<IObituarySubmission[]>(
    `/cases/${caseId}/obituary/submissions`,
  );
  return res.data;
}

export async function confirmPublished(
  submissionId: string,
  dto: { publishedUrl?: string; publishedAt?: string },
): Promise<IObituarySubmission> {
  const res = await apiClient.post<IObituarySubmission>(
    `/obituary-submissions/${submissionId}/confirm-published`,
    dto,
  );
  return res.data;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: IObituarySubmission['status'],
): Promise<IObituarySubmission> {
  const res = await apiClient.patch<IObituarySubmission>(
    `/obituary-submissions/${submissionId}/status`,
    { status },
  );
  return res.data;
}
