import { apiClient } from './client';

export interface MyPerformance {
  casesThisMonth: number;
  totalCases: number;
  avgTimeToCloseDays: number | null;
  taskCompletionRate: number | null;
  avgCaseValue: number;
  totalRevenue: number;
}

export interface Benchmarks {
  peerCount: number;
  medianCasesPerMonth: number | null;
  medianAvgTimeToCloseDays: number | null;
  medianTaskCompletionRate: number | null;
  medianAvgCaseValue: number | null;
}

export async function getMyPerformance(): Promise<MyPerformance> {
  const res = await apiClient.get<MyPerformance>('/analytics/my-performance');
  return res.data;
}

export async function getBenchmarks(): Promise<Benchmarks> {
  const res = await apiClient.get<Benchmarks>('/analytics/benchmarks');
  return res.data;
}
