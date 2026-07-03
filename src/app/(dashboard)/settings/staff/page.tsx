'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Plus, UserCheck, UserX } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { extractErrorMessage } from '@/lib/utils/error-message';

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: 'funeral_director' | 'staff';
  active: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  funeral_director: 'Funeral Director',
  staff: 'Staff',
};

export default function StaffPage() {
  const queryClient = useQueryClient();

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'funeral_director' | 'staff'>('staff');

  // Edit dialog state
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'funeral_director' | 'staff'>('staff');

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: () => apiClient.get('/users').then((r) => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/users/invite', { email: inviteEmail, name: inviteName, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Invitation sent to ${inviteEmail}.`);
      setInviteOpen(false);
      setInviteEmail(''); setInviteName(''); setInviteRole('staff');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Failed to send invitation.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, role }: { id: string; name: string; role: string }) =>
      apiClient.patch(`/users/${id}`, { name, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated.');
      setEditMember(null);
    },
    onError: () => toast.error('Failed to update staff member.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated.');
    },
    onError: () => toast.error('Failed to deactivate staff member.'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/users/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member reactivated.');
    },
    onError: () => toast.error('Failed to reactivate staff member.'),
  });

  function openEdit(member: StaffMember) {
    setEditMember(member);
    setEditName(member.name);
    setEditRole(member.role);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Staff"
        description="Manage team members for your funeral home."
        action={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="font-medium">Full Name</Label>
                  <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-medium">Email</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-medium">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funeral_director">Funeral Director</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!inviteEmail || !inviteName || inviteMutation.isPending}
                  onClick={() => inviteMutation.mutate()}
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          No team members yet. Invite your first staff member above.
        </div>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border/60">
          {staff.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {!member.active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(member)}>
                      Edit
                    </DropdownMenuItem>
                    {member.active ? (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deactivateMutation.mutate(member.id)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => reactivateMutation.mutate(member.id)}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-medium">Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium">Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as typeof editRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="funeral_director">Funeral Director</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!editName || updateMutation.isPending}
              onClick={() =>
                editMember && updateMutation.mutate({ id: editMember.id, name: editName, role: editRole })
              }
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
