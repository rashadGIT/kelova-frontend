import { apiClient } from './client';
import type { IDocument } from '@/types';
import { DocumentType } from '@/types';

export interface PresignedUrlResponse {
  uploadUrl: string;
  documentId: string;
  key: string;
}

export async function getCaseDocuments(caseId: string): Promise<IDocument[]> {
  const res = await apiClient.get<IDocument[]>(`/cases/${caseId}/documents`);
  return res.data;
}

export async function getPresignedUploadUrl(
  caseId: string,
  fileName: string,
  contentType: string,
  documentType: DocumentType,
): Promise<PresignedUrlResponse> {
  const res = await apiClient.post<PresignedUrlResponse>(`/cases/${caseId}/documents/presign`, {
    fileName,
    contentType,
    documentType,
  });
  return res.data;
}

export async function confirmDocumentUpload(caseId: string, documentId: string): Promise<void> {
  await apiClient.post(`/cases/${caseId}/documents/confirm`, { documentId });
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const res = await apiClient.get<{ url: string }>(`/documents/${documentId}/url`);
  return res.data.url;
}

export async function generateReceipt(
  caseId: string,
): Promise<{ documentId: string; url: string }> {
  const res = await apiClient.post<{ documentId: string; url: string }>(
    `/cases/${caseId}/receipts/generate`,
  );
  return res.data;
}

export async function generateGplPdf(caseId: string): Promise<{ documentId: string; url: string }> {
  const res = await apiClient.post<{ documentId: string; url: string }>(
    `/cases/${caseId}/gpl/generate`,
  );
  return res.data;
}
