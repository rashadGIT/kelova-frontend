'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, X, Clock, Users, LogOut } from 'lucide-react';
import {
  searchTenants,
  sendInvite,
  getIncomingInvites,
  getOutgoingInvites,
  acceptInvite,
  rejectInvite,
  cancelInvite,
  leaveGroup,
  getMultiLocationSummary,
  type TenantSearchResult,
  type LocationInvite,
} from '@/lib/api/multi-location';
import { extractErrorMessage } from '@/lib/utils/error-message';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function MultiLocationSettingsPage() {
  const qc = useQueryClient();

  // ── Current group status ──────────────────────────────────────────────────
  const { data: groupSummary, isLoading: groupLoading } = useQuery({
    queryKey: ['multi-location-summary'],
    queryFn: getMultiLocationSummary,
    retry: false,
  });

  const inGroup = !!groupSummary;

  // ── Invites ───────────────────────────────────────────────────────────────
  const { data: incoming = [], isLoading: incomingLoading } = useQuery({
    queryKey: ['location-invites-incoming'],
    queryFn: getIncomingInvites,
  });

  const { data: outgoing = [], isLoading: outgoingLoading } = useQuery({
    queryKey: ['location-invites-outgoing'],
    queryFn: getOutgoingInvites,
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<TenantSearchResult | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: searchResults = [],
    isFetching: searching,
    refetch: runSearch,
  } = useQuery({
    queryKey: ['tenant-search', searchQuery],
    queryFn: () => searchTenants(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 10_000,
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedTenant(null);
    if (searchRef.current) clearTimeout(searchRef.current);
    if (val.length >= 2) {
      searchRef.current = setTimeout(() => runSearch(), 300);
    }
  };

  useEffect(() => () => { if (searchRef.current) clearTimeout(searchRef.current); }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: () =>
      sendInvite(selectedTenant!.id, displayName, parseInt(expiresInDays, 10)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['location-invites-outgoing'] });
      toast.success(`Invite sent to ${selectedTenant!.name}.`);
      setSelectedTenant(null);
      setSearchQuery('');
      setDisplayName('');
      setExpiresInDays('7');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Failed to send invite.'));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['location-invites-incoming'] });
      qc.invalidateQueries({ queryKey: ['multi-location-summary'] });
      toast.success('Invite accepted. You are now part of a location group.');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Failed to accept invite.'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['location-invites-incoming'] });
      toast.success('Invite declined.');
    },
    onError: () => toast.error('Failed to decline invite.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelInvite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['location-invites-outgoing'] });
      toast.success('Invite cancelled.');
    },
    onError: () => toast.error('Failed to cancel invite.'),
  });

  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaveMutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-location-summary'] });
      toast.success('You have left the location group.');
      setLeaveOpen(false);
    },
    onError: () => toast.error('Failed to leave group.'),
  });

  const canSendInvite =
    !!selectedTenant && displayName.trim().length >= 2 && !sendMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <PageHeader
        title="Multi-Location"
        description="Link your funeral home with other locations to share analytics and coordinate operations."
      />

      {/* ── Current group ──────────────────────────────────────────────── */}
      {groupLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : inGroup && groupSummary ? (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Your Group</span>
              <Badge variant="secondary">{groupSummary.locations.length} locations</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Leave Group
            </Button>
          </div>
          <div className="grid gap-2">
            {groupSummary.locations.map((loc) => (
              <div
                key={loc.locationId}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted/50"
              >
                <span className="font-medium">{loc.displayName}</span>
                <span className="text-muted-foreground">{loc.activeCases} active cases</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Invite section (only when not in group) ────────────────────── */}
      {!groupLoading && !inGroup && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Find a Funeral Home</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search by name or URL slug. The receiving director must approve your request.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchQuery(''); setSelectedTenant(null); }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchQuery.length >= 2 && !searching && searchResults.length > 0 && !selectedTenant && (
            <div className="rounded-xl border border-border bg-popover shadow-sm divide-y divide-border/60">
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => {
                    setSelectedTenant(t);
                    setSearchQuery(t.name);
                    setDisplayName(t.name);
                  }}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-muted-foreground text-xs">{t.slug}</span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !selectedTenant && (
            <p className="text-sm text-muted-foreground px-1">No funeral homes found.</p>
          )}

          {/* Invite form — shown after selection */}
          {selectedTenant && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inviting: {selectedTenant.name}</span>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setSelectedTenant(null); setSearchQuery(''); }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-sm">
                    Your display name in this group
                  </Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Oak Hill — Main Street"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expires" className="text-sm">
                    Invite expires in
                  </Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger id="expires" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                disabled={!canSendInvite}
                onClick={() => sendMutation.mutate()}
                className="w-full sm:w-auto"
              >
                {sendMutation.isPending ? 'Sending…' : 'Send Link Request'}
              </Button>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* ── Incoming requests ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Incoming Requests{incoming.length > 0 && ` (${incoming.length})`}
        </h3>

        {incomingLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending incoming requests.</p>
        ) : (
          <div className="space-y-2">
            {incoming.map((inv: LocationInvite) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{inv.fromTenant?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sent {daysSince(inv.createdAt)} day{daysSince(inv.createdAt) !== 1 ? 's' : ''} ago
                    {' · '}
                    Expires in {daysUntil(inv.expiresAt)} day{daysUntil(inv.expiresAt) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(inv.id)}
                    disabled={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(inv.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Sent requests ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Sent Requests{outgoing.length > 0 && ` (${outgoing.length})`}
        </h3>

        {outgoingLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : outgoing.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sent requests.</p>
        ) : (
          <div className="space-y-2">
            {outgoing.map((inv: LocationInvite) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{inv.toTenant?.name ?? '—'}</p>
                    <Badge
                      variant={
                        inv.status === 'ACCEPTED'
                          ? 'default'
                          : inv.status === 'REJECTED' || inv.status === 'EXPIRED'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs capitalize"
                    >
                      {inv.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sent {daysSince(inv.createdAt)} day{daysSince(inv.createdAt) !== 1 ? 's' : ''} ago
                    {inv.status === 'PENDING' &&
                      ` · Expires in ${daysUntil(inv.expiresAt)} day${daysUntil(inv.expiresAt) !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {inv.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => cancelMutation.mutate(inv.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Leave group confirmation dialog ────────────────────────────── */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Location Group?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            If you are the last remaining member, the group will be dissolved automatically.
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? 'Leaving…' : 'Leave Group'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
