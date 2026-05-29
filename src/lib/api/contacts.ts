import { apiClient } from './client';
import type { IFamilyContact } from '@/types';

export interface CreateContactDto {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  isPrimaryContact?: boolean;
}

export async function getContacts(caseId: string): Promise<IFamilyContact[]> {
  const res = await apiClient.get<IFamilyContact[]>(`/cases/${caseId}/contacts`);
  return res.data;
}

export async function createContact(caseId: string, dto: CreateContactDto): Promise<IFamilyContact> {
  const res = await apiClient.post<IFamilyContact>(`/cases/${caseId}/contacts`, dto);
  return res.data;
}

export async function updateContact(
  caseId: string,
  contactId: string,
  dto: Partial<CreateContactDto>,
): Promise<IFamilyContact> {
  const res = await apiClient.patch<IFamilyContact>(
    `/cases/${caseId}/contacts/${contactId}`,
    dto,
  );
  return res.data;
}

export async function deleteContact(caseId: string, contactId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/contacts/${contactId}`);
}
