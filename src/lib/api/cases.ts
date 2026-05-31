import { apiClient } from './client';
import type { ICase } from '@/types';
import { CaseStatus, ServiceType } from '@/types';

export interface CreateCaseDto {
  deceasedFirstName: string;
  deceasedLastName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  serviceType: ServiceType;
  assignedTo?: string;
  notes?: string;
}

export interface CaseFilters {
  status?: CaseStatus;
  serviceType?: ServiceType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dashboardFilter?: 'active' | 'overdue' | 'this-month' | 'pending-signatures';
}

export interface CasesPage {
  data: ICase[];
  total: number;
  page: number;
  limit: number;
}

export async function getCases(filters?: CaseFilters): Promise<CasesPage> {
  const res = await apiClient.get<CasesPage>('/cases', { params: filters });
  return res.data;
}

export async function getCaseById(id: string): Promise<ICase> {
  const res = await apiClient.get<ICase>(`/cases/${id}`);
  return res.data;
}

export async function createCase(dto: CreateCaseDto): Promise<ICase> {
  const res = await apiClient.post<ICase>('/cases', {
    deceasedName: `${dto.deceasedFirstName} ${dto.deceasedLastName}`.trim(),
    serviceType: dto.serviceType,
    ...(dto.dateOfBirth && { deceasedDob: dto.dateOfBirth }),
    ...(dto.dateOfDeath && { deceasedDod: dto.dateOfDeath }),
    ...(dto.assignedTo && { assignedToId: dto.assignedTo }),
  });
  return res.data;
}

export async function updateCaseStatus(id: string, status: CaseStatus): Promise<ICase> {
  const res = await apiClient.patch<ICase>(`/cases/${id}/status`, { status });
  return res.data;
}

export async function sendIntakeForm(caseId: string): Promise<{ sent: boolean; email: string }> {
  const res = await apiClient.post<{ sent: boolean; email: string }>(`/cases/${caseId}/send-intake-form`);
  return res.data;
}
