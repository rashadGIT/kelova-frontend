'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import {
  getConversations,
  getMessages,
  getAvailableUsers,
  type ConversationSummary,
  type MessageRecord,
} from '@/lib/api/messaging';
import { markConversationRead } from '@/lib/api/messaging';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageThread } from '@/components/messaging/message-thread';
import { MessageInput } from '@/components/messaging/message-input';
import { NewConversationModal } from '@/components/messaging/new-conversation-modal';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { useMessagingSocket } from '@/hooks/use-messaging-socket';
import { useAuthStore } from '@/lib/store/auth.store';

export default function MessagingPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversation, clearUnread } =
    useMessagingStore();

  const [newModalOpen, setNewModalOpen] = useState(false);

  const { sendMessage, sendTypingStart, sendTypingStop } = useMessagingSocket(user?.id);

  const { data: conversations = [] } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: 30_000,
  });

  const { data: messages = [] } = useQuery<MessageRecord[]>({
    queryKey: ['messages', activeConversationId],
    queryFn: () => getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  const { data: availableUsers = [] } = useQuery({
    queryKey: ['messaging-available-users'],
    queryFn: getAvailableUsers,
    staleTime: 5 * 60_000,
  });

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  // userId → display name (includes self + all reachable users)
  const participantNames = useMemo(() => {
    const map: Record<string, string> = {};
    availableUsers.forEach((u) => { map[u.id] = u.name; });
    if (user) map[user.id] = user.name; // add self so own messages resolve too
    return map;
  }, [availableUsers, user]);

  const handleSelect = useCallback(
    async (id: string) => {
      setActiveConversation(id);
      clearUnread(id);
      await markConversationRead(id).catch(() => {});
    },
    [setActiveConversation, clearUnread],
  );

  const handleSend = useCallback(
    (body: string) => {
      if (!activeConversationId) return;
      sendMessage(activeConversationId, body);
    },
    [activeConversationId, sendMessage],
  );

  const handleNewCreated = useCallback(
    (conv: ConversationSummary) => {
      queryClient.setQueryData<ConversationSummary[]>(['conversations'], (old = []) =>
        old.find((c) => c.id === conv.id) ? old : [conv, ...old],
      );
      void handleSelect(conv.id);
    },
    [handleSelect, queryClient],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8 overflow-hidden">
      {/* Left pane — conversation list */}
      <div className="w-80 shrink-0 hidden sm:flex flex-col">
        <ConversationList
          conversations={conversations}
          participantNames={participantNames}
          onSelect={handleSelect}
          onNew={() => setNewModalOpen(true)}
        />
      </div>

      {/* Right pane — active thread */}
      <div className={`${activeConversationId ? 'flex' : 'hidden sm:flex'} flex-col flex-1 min-w-0`}>
        {activeConversationId && activeConversation ? (
          <>
            {/* Header */}
            <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
              <button
                className="sm:hidden -ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setActiveConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="font-semibold text-sm">
                  {activeConversation.name ??
                    (activeConversation.type === 'case_thread'
                      ? 'Case Thread'
                      : activeConversation.participants
                          .filter((p) => p.userId !== user?.id)
                          .map((p) => participantNames[p.userId] ?? 'Staff')
                          .join(', '))}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {activeConversation.type.replace('_', ' ')} ·{' '}
                  {activeConversation.participants.length} participants
                </p>
              </div>
            </div>

            <MessageThread
              messages={messages}
              conversationId={activeConversationId}
              participantNames={participantNames}
            />
            <MessageInput
              onSend={handleSend}
              onTypingStart={() => sendTypingStart(activeConversationId)}
              onTypingStop={() => sendTypingStop(activeConversationId)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Mobile conversation list — shown when no active conversation */}
      {!activeConversationId && (
        <div className="flex sm:hidden flex-col flex-1">
          <ConversationList
            conversations={conversations}
            participantNames={participantNames}
            onSelect={handleSelect}
            onNew={() => setNewModalOpen(true)}
          />
        </div>
      )}

      <NewConversationModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onCreated={handleNewCreated}
      />
    </div>
  );
}
