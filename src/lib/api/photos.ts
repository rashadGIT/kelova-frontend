import { apiClient } from './client';

export interface CasePhoto {
  id: string;
  caseId: string;
  fileName: string;
  s3Key: string;
  url: string;
  createdAt: string;
}

export async function getCasePhotos(caseId: string): Promise<CasePhoto[]> {
  const res = await apiClient.get<CasePhoto[]>(`/cases/${caseId}/photos`);
  return res.data;
}

export async function presignPhoto(
  caseId: string,
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; photoId: string; s3Key: string }> {
  const res = await apiClient.post<{ uploadUrl: string; photoId: string; s3Key: string }>(
    `/cases/${caseId}/photos/presign`,
    { fileName, contentType, documentType: 'photo' },
  );
  return res.data;
}

export async function confirmPhoto(caseId: string, documentId: string): Promise<void> {
  await apiClient.post(`/cases/${caseId}/photos/confirm`, { documentId });
}

export async function deletePhoto(caseId: string, photoId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/photos/${photoId}`);
}
