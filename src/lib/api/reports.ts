import { apiClient } from './client';

export interface ReportCard {
  id: string;
  name: string;
  category: string;
}

export async function getReports(): Promise<ReportCard[]> {
  const res = await apiClient.get<ReportCard[]>('/analytics/reports');
  return res.data;
}
