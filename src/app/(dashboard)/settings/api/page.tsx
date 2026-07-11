'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Check, Key, Webhook } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  getSupportedWebhookEvents,
  type ApiKeyRecord,
  type WebhookSubscription,
  type CreatedApiKey,
} from '@/lib/api/api-keys';
import { format } from 'date-fns';

// ─── API Keys Section ────────────────────────────────────────────────────────

function ApiKeysSection() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: listApiKeys,
  });

  const createMutation = useMutation({
    mutationFn: () => createApiKey({ name: newKeyName }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(created);
      setNewKeyName('');
    },
    onError: () => toast.error('Failed to create API key.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked.');
    },
    onError: () => toast.error('Failed to revoke key.'),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">API Keys</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Authenticate external integrations using the <code className="text-xs bg-muted px-1 py-0.5 rounded">X-API-Key</code> header.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Key name (e.g. My Integration)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="max-w-xs"
          />
          <Button
            size="sm"
            disabled={!newKeyName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No API keys yet.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border/60">
            {keys.map((k: ApiKeyRecord) => (
              <div key={k.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{k.prefix}_••••••••</p>
                  {k.lastUsedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last used {format(new Date(k.lastUsedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive ml-4 shrink-0"
                  onClick={() => revokeMutation.mutate(k.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* One-time key reveal dialog */}
      <Dialog open={!!createdKey} onOpenChange={(o) => { if (!o) setCreatedKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Copy your new API key now — it will <strong>never be shown again</strong>.
            </p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono break-all">
                {createdKey?.key}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => copyKey(createdKey?.key ?? '')}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={() => setCreatedKey(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Webhooks Section ────────────────────────────────────────────────────────

function WebhooksSection() {
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: listWebhooks,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: getSupportedWebhookEvents,
  });
  const supportedEvents = eventsData?.events ?? [];

  const createMutation = useMutation({
    mutationFn: () => createWebhook({ url: newUrl, events: selectedEvents }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(`Webhook registered. Secret: ${created.secret?.slice(0, 24)}… (save it)`);
      setNewUrl('');
      setSelectedEvents([]);
      setShowForm(false);
    },
    onError: () => toast.error('Failed to register webhook.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted.');
    },
    onError: () => toast.error('Failed to delete webhook.'),
  });

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Webhooks</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Webhook
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Receive real-time HTTP POST notifications when events occur. Requests are signed with <code className="text-xs bg-muted px-1 py-0.5 rounded">X-Kelova-Signature</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
            <div>
              <Label>Endpoint URL</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://yourapp.com/webhooks"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="mb-2 block">Events</Label>
              <div className="flex flex-wrap gap-2">
                {supportedEvents.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedEvents.includes(event)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-input hover:border-foreground'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!newUrl || selectedEvents.length === 0 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Saving…' : 'Register Webhook'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No webhooks registered yet.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border/60">
            {webhooks.map((wh: WebhookSubscription) => (
              <div key={wh.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-sm truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {wh.events.map((e) => (
                        <Badge key={e} variant="outline" className="text-xs">
                          {e}
                        </Badge>
                      ))}
                    </div>
                    {wh.lastDeliveredAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last delivered {format(new Date(wh.lastDeliveredAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={wh.active ? 'default' : 'secondary'} className="text-xs">
                      {wh.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(wh.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApiSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="API & Integrations" />
      <ApiKeysSection />
      <WebhooksSection />
    </div>
  );
}
