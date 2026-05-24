import { apiClient } from './client';

export interface FirstCall {
  id: string;
  caller: string;
  phone: string;
  deceased: string;
  time: string;
  processed: boolean;
}

export async function getFirstCalls(): Promise<FirstCall[]> {
  const res = await apiClient.get<FirstCall[]>('/first-calls');
  return res.data;
}
