'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { getFamilyMessages, postFamilyMessage } from '@/lib/api/cases';
import { cn } from '@/lib/utils/cn';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FamilyMessagesCard({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['family-messages', caseId],
    queryFn: () => getFamilyMessages(caseId),
    refetchInterval: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => postFamilyMessage(caseId, body),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['family-messages', caseId] });
    },
    onError: () => toast.error('Failed to send message.'),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Family Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-2/4 ml-auto" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Family members can message you from their portal.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col gap-0.5 max-w-[80%]',
                  msg.senderType === 'staff' ? 'ml-auto items-end' : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    msg.senderType === 'staff'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {msg.body}
                </div>
                <span className="text-[11px] text-muted-foreground px-1">
                  {msg.senderType === 'staff' ? 'You' : 'Family'} · {formatTime(msg.createdAt)}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to family… (Enter to send)"
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            size="icon"
            className="h-auto self-end pb-2"
            disabled={!draft.trim() || sendMutation.isPending}
            onClick={submit}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
