'use client';

import { Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createAdminUser, getAdminTenants } from '@/lib/api/admin';
import { extractErrorMessage } from '@/lib/utils/error-message';
import { UserRole } from '@/types';

const ROLES = [UserRole.funeral_director, UserRole.staff] as const;

function NewAdminUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedTenantId = searchParams.get('tenantId') ?? '';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<typeof ROLES[number]>(UserRole.staff);
  const [tenantId, setTenantId] = useState(preselectedTenantId);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const { data: tenants = [] } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: getAdminTenants,
  });

  const mutation = useMutation({
    mutationFn: () => createAdminUser({ email, name, role, tenantId, temporaryPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${email} created.`);
      router.push('/super-admin/users');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err, 'Failed to create user')),
  });

  const isValid = email && name && role && tenantId && temporaryPassword.length >= 12;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-2">
        <Link href="/super-admin/users" className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Users
        </Link>
      </div>

      <PageHeader title="New User" description="Create a user in any funeral home." />

      <div className="rounded-xl border border-border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Funeral Home</Label>
          <Select value={tenantId || undefined} onValueChange={setTenantId}>
            <SelectTrigger><SelectValue placeholder="Select a funeral home" /></SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof ROLES[number])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Temporary Password</Label>
          <Input
            type="text"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            placeholder="Min 12 characters"
          />
          <p className="text-xs text-muted-foreground">User will be required to change this on first login.</p>
        </div>

        <Button className="w-full" disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </div>
  );
}

export default function NewAdminUserPage() {
  return (
    <Suspense fallback={<div className="space-y-4 max-w-lg"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>}>
      <NewAdminUserForm />
    </Suspense>
  );
}
