'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { useAuthStore } from '@/lib/store/auth.store';
import type { ConversationSummary } from '@/lib/api/messaging';

interface ConversationListProps {
  conversations: ConversationSummary[];
  participantNames: Record<string, string>;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function conversationDisplayName(
  conv: ConversationSummary,
  currentUserId: string,
  participantNames: Record<string, string>,
): string {
  if (conv.name) return conv.name;
  if (conv.type === 'case_thread') return 'Case Thread';
  const others = conv.participants.filter((p) => p.userId !== currentUserId);
  return others.map((p) => participantNames[p.userId] ?? 'Staff').join(', ') || 'Conversation';
}

export function ConversationList({
  conversations,
  participantNames,
  onSelect,
  onNew,
}: ConversationListProps) {
  const user = useAuthStore((s) => s.user);
  const { activeConversationId, unreadCounts } = useMessagingStore();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-sm">Chats</h2>
        <Button variant="ghost" size="icon" onClick={onNew} aria-label="New conversation">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground px-4 text-center">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-sm">No conversations yet</p>
            <Button variant="outline" size="sm" onClick={onNew}>
              Start a conversation
            </Button>
          </div>
        )}

        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const unread = unreadCounts[conv.id] ?? conv.unreadCount ?? 0;
          const displayName = conversationDisplayName(conv, user.id, participantNames);
          const lastMsg = conv.lastMessage;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border/60 hover:bg-accent/50 transition-colors',
                isActive && 'bg-accent',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-sm truncate', unread > 0 && 'font-semibold')}>
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unread > 0 && (
                    <Badge variant="default" className="h-5 min-w-5 text-xs px-1.5">
                      {unread > 99 ? '99+' : unread}
                    </Badge>
                  )}
                  {lastMsg && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
              </div>
              {lastMsg && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {lastMsg.body}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
