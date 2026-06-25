import { apiClient } from './client';

export interface InsuranceAssignment {
  id: string;
  insuredName: string;
  insuranceCompany: string;
  policyNumber: string;
  faceValue: number;
  claimantName: string;
  relationship: string;
  status: 'pending' | 'submitted' | 'approved' | 'funded';
  submittedAt?: string | null;
}

export interface InsuranceFollowUp {
  id: string;
  method: 'call' | 'email' | 'portal';
  notes?: string | null;
  nextFollowUpDate?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export interface CreateFollowUpDto {
  method: 'call' | 'email' | 'portal';
  notes?: string;
  nextFollowUpDate?: string;
}

export interface StationeryTemplate {
  id: string;
  name: string;
  category: string;
}

export interface TributeVideoStatus {
  status: 'pending' | 'generating' | 'ready' | 'failed';
  videoUrl?: string;
}

export interface ShowroomProduct {
  id: string;
  name: string;
  previewImage: string | null;
}

export interface GraveCareService {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface GraveCareOrder {
  id: string;
  serviceType: string;
  requestedDate: string;
  status: string;
}

export async function getInsurance(caseId: string): Promise<InsuranceAssignment | null> {
  const res = await apiClient.get<InsuranceAssignment>(`/cases/${caseId}/insurance`);
  return res.data;
}

export async function getInsuranceFollowUps(assignmentId: string): Promise<InsuranceFollowUp[]> {
  const res = await apiClient.get<InsuranceFollowUp[]>(`/insurance-assignments/${assignmentId}/follow-ups`);
  return res.data;
}

export async function addInsuranceFollowUp(assignmentId: string, dto: CreateFollowUpDto): Promise<InsuranceFollowUp> {
  const res = await apiClient.post<InsuranceFollowUp>(`/insurance-assignments/${assignmentId}/follow-ups`, dto);
  return res.data;
}

export async function getStationeryTemplates(): Promise<StationeryTemplate[]> {
  const res = await apiClient.get<StationeryTemplate[]>('/stationery/templates');
  return res.data;
}

export async function getTributeVideoStatus(caseId: string): Promise<TributeVideoStatus> {
  const res = await apiClient.get<TributeVideoStatus>(`/cases/${caseId}/tribute-video`);
  return res.data;
}

export async function getShowroomProducts(): Promise<ShowroomProduct[]> {
  const res = await apiClient.get<ShowroomProduct[]>('/product-showroom');
  return res.data;
}

export async function getGraveCareServices(): Promise<GraveCareService[]> {
  const res = await apiClient.get<GraveCareService[]>('/grave-care/services');
  return res.data;
}

export async function getGraveCareOrders(caseId: string): Promise<GraveCareOrder[]> {
  const res = await apiClient.get<GraveCareOrder[]>(`/cases/${caseId}/grave-care`);
  return res.data;
}
