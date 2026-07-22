import { apiClient } from './client';

export type TributeBookStatus =
  | 'draft'
  | 'generating'
  | 'ready'
  | 'pending'
  | 'ordered'
  | 'shipped'
  | 'delivered';

export interface TributeBook {
  id: string;
  tenantId: string;
  caseId: string;
  status: TributeBookStatus;
  coverPhotoDocumentId: string | null;
  photoDocumentIds: string[];
  generatedDocumentId: string | null;
  generatedAt: string | null;
  includeGuestbook: boolean;
  sharedWithFamilyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getTributeBook(caseId: string): Promise<TributeBook> {
  const res = await apiClient.get<TributeBook>(`/cases/${caseId}/tribute-book`);
  return res.data;
}

export async function generateTributeBook(caseId: string): Promise<TributeBook> {
  const res = await apiClient.post<TributeBook>(`/cases/${caseId}/tribute-book/generate`);
  return res.data;
}

export async function selectTributeBookPhotos(
  caseId: string,
  photoDocumentIds: string[],
): Promise<TributeBook> {
  const res = await apiClient.patch<TributeBook>(`/cases/${caseId}/tribute-book/photos`, {
    photoDocumentIds,
  });
  return res.data;
}

export async function setTributeBookCoverPhoto(
  caseId: string,
  documentId: string | null,
): Promise<TributeBook> {
  const res = await apiClient.patch<TributeBook>(`/cases/${caseId}/tribute-book/cover`, {
    documentId,
  });
  return res.data;
}

export async function setTributeBookIncludeGuestbook(
  caseId: string,
  tributeBookId: string,
  includeGuestbook: boolean,
): Promise<TributeBook> {
  const res = await apiClient.patch<TributeBook>(`/tribute-books/${tributeBookId}`, {
    includeGuestbook,
  });
  return res.data;
}

export async function shareTributeBookWithFamily(caseId: string): Promise<TributeBook> {
  const res = await apiClient.post<TributeBook>(`/cases/${caseId}/tribute-book/share`);
  return res.data;
}
