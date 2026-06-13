import axios from 'axios';
import { apiClient } from './client';
import { publicApiClient } from './public-client';

export type FeedbackCategory = 'bug' | 'feature_request' | 'general';
export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'closed';

export interface FeedbackItem {
  id: string;
  tenantId: string | null;
  category: FeedbackCategory;
  status: FeedbackStatus;
  message: string;
  submitterName: string | null;
  submitterEmail: string | null;
  pageUrl: string | null;
  attachmentKeys: string[];
  clickupTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackDto {
  category: FeedbackCategory;
  message: string;
  submitterName?: string;
  submitterEmail?: string;
  pageUrl?: string;
  attachmentKeys?: string[];
}

export interface ListFeedbackFilter {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  page?: number;
  limit?: number;
}

// ── Public (no auth) ─────────────────────────────────────────────────────────

export async function presignFeedbackAttachment(
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; s3Key: string }> {
  const res = await publicApiClient.post<{ uploadUrl: string; s3Key: string }>(
    '/feedback/presign-attachment',
    { fileName, contentType },
  );
  return res.data;
}

export async function uploadToS3(uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false,
    onUploadProgress: e => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export async function submitFeedback(dto: CreateFeedbackDto): Promise<{ id: string }> {
  const res = await publicApiClient.post<{ id: string }>('/feedback', dto);
  return res.data;
}

// ── Authenticated (super-admin) ───────────────────────────────────────────────

export async function getAdminFeedback(
  filter: ListFeedbackFilter,
): Promise<{ items: FeedbackItem[]; total: number }> {
  const res = await apiClient.get<{ items: FeedbackItem[]; total: number }>(
    '/super-admin/feedback',
    { params: filter },
  );
  return res.data;
}

export async function getAdminFeedbackDetail(id: string): Promise<FeedbackItem> {
  const res = await apiClient.get<FeedbackItem>(`/super-admin/feedback/${id}`);
  return res.data;
}

export async function getFeedbackAttachmentUrls(
  id: string,
): Promise<{ key: string; url: string }[]> {
  const res = await apiClient.get<{ key: string; url: string }[]>(
    `/super-admin/feedback/${id}/attachments`,
  );
  return res.data;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  await apiClient.patch(`/super-admin/feedback/${id}/status`, { status });
}

export async function retryClickupTask(id: string): Promise<void> {
  await apiClient.post(`/super-admin/feedback/${id}/clickup-task`);
}
