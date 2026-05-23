import { apiClient } from './client';
import type { IArrangementConference } from '@/types';

export interface UpsertArrangementConferenceDto {
  conductedBy?: string;
  heldAt?: string;
  familyPresentNames?: string;
  serviceTypeSelected?: string;
  merchandiseSelected?: string;
  totalEstimate?: number;
  contractSigned?: boolean;
  signedAt?: string;
  followUpRequired?: boolean;
  followUpNotes?: string;
  notes?: string;
}

export async function getArrangementConference(caseId: string): Promise<IArrangementConference | null> {
  const res = await apiClient
    .get<IArrangementConference>(`/cases/${caseId}/arrangement-conference`)
    .catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });
  return res ? res.data : null;
}

export async function upsertArrangementConference(
  caseId: string,
  dto: UpsertArrangementConferenceDto,
): Promise<IArrangementConference> {
  const res = await apiClient.put<IArrangementConference>(
    `/cases/${caseId}/arrangement-conference`,
    dto,
  );
  return res.data;
}
