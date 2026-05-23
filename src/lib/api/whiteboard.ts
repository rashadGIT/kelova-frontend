import { apiClient } from './client';

export interface WhiteboardColumn {
  id: string;
  title: string;
  color: string;
  caseCount: number;
}

export async function getWhiteboardColumns(): Promise<WhiteboardColumn[]> {
  const res = await apiClient.get<WhiteboardColumn[]>('/whiteboard/columns');
  return res.data;
}
