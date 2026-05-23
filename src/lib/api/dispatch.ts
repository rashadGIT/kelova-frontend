import { apiClient } from './client';

export interface DispatchAssignment {
  id: string;
  type: string;
  caseName: string;
  assignedTo: string;
  scheduled: string;
  status: 'pending' | 'en_route' | 'completed';
}

export async function getDispatchAssignments(): Promise<DispatchAssignment[]> {
  const res = await apiClient.get<DispatchAssignment[]>('/dispatch');
  return res.data;
}
