'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  getAvailableUsers,
  createConversation,
  type AvailableUser,
  type ConversationSummary,
} from '@/lib/api/messaging';
import { useAuthStore } from '@/lib/store/auth.store';
import { extractErrorMessage } from '@/lib/utils/error-message';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversation: ConversationSummary) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onCreated,
}: NewConversationModalProps) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AvailableUser[]>([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['messaging-available-users'],
    queryFn: getAvailableUsers,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conv) => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      onCreated(conv);
      onOpenChange(false);
      setSelected([]);
      setSearch('');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Failed to start conversation'));
    },
  });

  function toggleUser(u: AvailableUser) {
    setSelected((prev) =>
      prev.find((s) => s.id === u.id)
        ? prev.filter((s) => s.id !== u.id)
        : [...prev, u],
    );
  }

  function handleStart() {
    if (selected.length === 0) return;
    mutation.mutate({
      type: selected.length === 1 ? 'direct' : 'group',
      participantUserIds: selected.map((u) => u.id),
    });
  }

  // Group users by tenant
  const grouped = users
    .filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    )
    .reduce<Record<string, { tenantName: string; users: AvailableUser[] }>>(
      (acc, u) => {
        const key = u.tenantId;
        if (!acc[key]) acc[key] = { tenantName: u.tenant.name, users: [] };
        acc[key].users.push(u);
        return acc;
      },
      {},
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
                  {u.name}
                  <button
                    onClick={() => toggleUser(u)}
                    className="rounded-full hover:bg-muted transition-colors"
                    aria-label={`Remove ${u.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border/60">
            {isLoading && (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            )}
            {!isLoading && Object.keys(grouped).length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No staff found</p>
            )}
            {Object.entries(grouped).map(([tenantId, group]) => (
              <div key={tenantId}>
                {group.tenantName !== user?.id && (
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                    {group.tenantName}
                  </p>
                )}
                {group.users.map((u) => {
                  const isSelected = !!selected.find((s) => s.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left',
                        isSelected && 'bg-accent',
                      )}
                    >
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleStart}
            disabled={selected.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? 'Starting…' : `Start Conversation${selected.length > 1 ? ' (Group)' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
