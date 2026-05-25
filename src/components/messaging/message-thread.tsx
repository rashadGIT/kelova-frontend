'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import type { MessageRecord } from '@/lib/api/messaging';

interface MessageThreadProps {
  messages: MessageRecord[];
  participantNames: Record<string, string>;
}

export function MessageThread({ messages, participantNames }: MessageThreadProps) {
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!user) return null;

  // Deduplicate by id (socket + REST refetch can both add same message)
  // then reverse from newest-first (API order) to oldest-first for display
  const seen = new Set<string>();
  const ordered = [...messages]
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .reverse();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {ordered.map((msg) => {
        const isOwn = msg.senderId === user.id;
        const senderName = isOwn ? 'You' : (participantNames[msg.senderId] ?? 'Staff');

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
      <div ref={bottomRef} />
    </div>
  );
}
