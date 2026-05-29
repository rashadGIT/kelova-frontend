'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/store/auth.store';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { cn } from '@/lib/utils/cn';
import type { MessageRecord } from '@/lib/api/messaging';

interface MessageThreadProps {
  messages: MessageRecord[];
  conversationId: string;
  participantNames: Record<string, string>;
}

export function MessageThread({ messages, conversationId, participantNames }: MessageThreadProps) {
  const user = useAuthStore((s) => s.user);
  const typingUserIds = useMessagingStore((s) => s.typingUserIds[conversationId] ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!user) return null;

  const seen = new Set<string>();
  const ordered = [...messages]
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .reverse();

  const typingNames = typingUserIds
    .filter((id) => id !== user.id)
    .map((id) => participantNames[id] ?? 'Someone');

  const typingLabel =
    typingNames.length === 1
      ? `${typingNames[0]} is typing…`
      : typingNames.length > 1
        ? `${typingNames.slice(0, -1).join(', ')} and ${typingNames.at(-1)} are typing…`
        : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {ordered.map((msg) => {
        const isOwn = msg.sender.id === user.id;
        const senderName = isOwn ? 'You' : msg.sender.name;

        return (
          <div
            key={msg.id}
            className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}
          >
            <span className="text-xs text-muted-foreground px-1">{senderName}</span>
            <div
              className={cn(
                'max-w-[70%] rounded-2xl px-4 py-2 text-sm break-words',
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm',
              )}
            >
              {msg.body}
            </div>
            <span className="text-xs text-muted-foreground px-1">
              {format(new Date(msg.createdAt), 'h:mm a')}
            </span>
          </div>
        );
      })}
      {typingLabel && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-muted-foreground">{typingLabel}</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
