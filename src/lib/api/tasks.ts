import { apiClient } from './client';
import type { ITask } from '@/types';

export interface ITaskWithCase extends ITask {
  case: { id: string; deceasedName: string } | null;
}

export async function getAllOpenTasks(): Promise<ITaskWithCase[]> {
  const res = await apiClient.get<ITaskWithCase[]>('/tasks');
  return res.data;
}

export async function getCaseTasks(caseId: string): Promise<ITask[]> {
  const res = await apiClient.get<ITask[]>(`/cases/${caseId}/tasks`);
  return res.data;
}

export async function updateTask(taskId: string, update: { completed?: boolean; assignedTo?: string; dueDate?: string }): Promise<ITask> {
  const res = await apiClient.patch<ITask>(`/tasks/${taskId}`, update);
  return res.data;
}
