import { apiClient } from './client';
import { publicApiClient } from './public-client';

export interface IMemorialPage {
  id: string;
  tenantId: string;
  caseId: string;
  slug: string;
  published: boolean;
  bioText: string | null;
  photoUrls: string[];
  guestbookEntries: GuestbookEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestbookEntry {
  name: string;
  message: string;
  createdAt: string;
}

export async function getCaseMemorial(caseId: string): Promise<IMemorialPage | null> {
  const res = await apiClient
    .get<IMemorialPage>(`/cases/${caseId}/memorial`)
    .catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });
  return res ? res.data : null;
}

export async function createMemorial(
  caseId: string,
  dto: { published?: boolean; bioText?: string; photoUrls?: string[] },
): Promise<IMemorialPage> {
  const res = await apiClient.post<IMemorialPage>(`/cases/${caseId}/memorial`, dto);
  return res.data;
}

export async function updateMemorial(
  id: string,
  dto: { published?: boolean; bioText?: string; photoUrls?: string[] },
): Promise<IMemorialPage> {
  const res = await apiClient.patch<IMemorialPage>(`/memorial/${id}`, dto);
  return res.data;
}

export async function getPublicMemorial(slug: string): Promise<IMemorialPage> {
  const res = await publicApiClient.get<IMemorialPage>(`/memorial/${slug}`);
  return res.data;
}

export async function addGuestbookEntry(
  slug: string,
  dto: { name: string; message: string },
): Promise<IMemorialPage> {
  const res = await publicApiClient.post<IMemorialPage>(
    `/memorial/${slug}/guestbook`,
    dto,
  );
  return res.data;
}
