import { apiClient } from './client';

export type ConversationType = 'direct' | 'group' | 'case_thread';

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenant: { name: string };
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  sender: { id: string; name: string };
  tenantId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  tenantId: string;
  lastReadAt: string | null;
  tenant?: { name: string };
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  caseId: string | null;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
}

export interface CreateConversationPayload {
  type: ConversationType;
  name?: string;
  caseId?: string;
  participantUserIds: string[];
}

export async function getAvailableUsers(): Promise<AvailableUser[]> {
  const res = await apiClient.get<AvailableUser[]>('/messaging/users/available');
  return res.data;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const res = await apiClient.get<ConversationSummary[]>('/messaging/conversations');
  return res.data;
}

export async function createConversation(
  payload: CreateConversationPayload,
): Promise<ConversationSummary> {
  const res = await apiClient.post<ConversationSummary>('/messaging/conversations', payload);
  return res.data;
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
): Promise<MessageRecord[]> {
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  const res = await apiClient.get<MessageRecord[]>(
    `/messaging/conversations/${conversationId}/messages`,
    { params },
  );
  return res.data;
}

export async function sendMessageHttp(
  conversationId: string,
  body: string,
): Promise<MessageRecord> {
  const res = await apiClient.post<MessageRecord>('/messaging/messages', {
    conversationId,
    body,
  });
  return res.data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.patch(`/messaging/conversations/${conversationId}/read`);
}

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const res = await apiClient.get<Record<string, number>>('/messaging/unread');
  return res.data;
}
