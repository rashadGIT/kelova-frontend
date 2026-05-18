'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';
import {
  getAdminUsers,
  updateAdminUser,
  resetAdminUserPassword,
} from '@/lib/api/admin';
import { UserRole } from '@/types';

const ROLES = [UserRole.super_admin, UserRole.funeral_director, UserRole.staff] as const;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', ''],
    queryFn: () => getAdminUsers(),
  });
  const user = users.find((u) => u.id === id);

  const [pendingRole, setPendingRole] = useState<UserRole | ''>('');

  const updateMutation = useMutation({
    mutationFn: (dto: { role?: UserRole; active?: boolean }) => updateAdminUser(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated.');
      setPendingRole('');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetAdminUserPassword(id),
    onSuccess: () => toast.success('Password reset email sent.'),
    onError: () => toast.error('Failed to reset password'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/super-admin/users" className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Users
        </Link>
        <p className="text-sm text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const effectiveRole = (pendingRole || user.role) as UserRole;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-2">
        <Link href="/super-admin/users" className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Users
        </Link>
      </div>

      <PageHeader
        title={user.name}
        description={
          <span className="flex items-center gap-2">
            <span>{user.email}</span>
            <span className="text-muted-foreground">·</span>
            <span>{user.tenant.name}</span>
            {!user.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
          </span>
        }
      />

      <div className="rounded-md border p-5 space-y-5">
        <h2 className="text-sm font-semibold">Settings</h2>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Status</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.active ? 'Active — user can log in.' : 'Inactive — login is blocked.'}
            </p>
          </div>
          <Button
            variant={user.active ? 'destructive' : 'outline'}
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ active: !user.active })}
          >
            {user.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="flex items-center gap-2">
            <Select
              value={effectiveRole}
              onValueChange={(v) => setPendingRole(v as UserRole)}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pendingRole && pendingRole !== user.role && (
              <Button
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ role: effectiveRole })}
              >
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Reset password */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {resetMutation.isPending ? 'Sending...' : 'Reset Password'}
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5">
            Sends a password reset email via Cognito.
          </p>
        </div>
      </div>
    </div>
  );
}
