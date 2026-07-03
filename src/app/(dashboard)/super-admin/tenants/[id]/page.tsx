'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getAdminTenants, updateAdminTenant } from '@/lib/api/admin';
import { useAdminStore } from '@/lib/store/admin.store';

const PLAN_TIERS = ['pilot', 'starter', 'growth', 'enterprise'] as const;

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: getAdminTenants,
  });
  const tenant = tenants.find((t) => t.id === id);

  const [planTier, setPlanTier] = useState<typeof PLAN_TIERS[number] | ''>('');
  const { enterTenantView } = useAdminStore();

  const updateMutation = useMutation({
    mutationFn: (dto: { planTier?: typeof PLAN_TIERS[number]; active?: boolean }) =>
      updateAdminTenant(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast.success('Tenant updated.');
    },
    onError: () => toast.error('Failed to update tenant'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Link href="/super-admin/tenants" className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to Funeral Homes
        </Link>
        <p className="text-sm text-muted-foreground">Tenant not found.</p>
      </div>
    );
  }

  const effectivePlan = (planTier || tenant.planTier) as typeof PLAN_TIERS[number];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/super-admin/tenants" className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Funeral Homes
        </Link>
      </div>

      <PageHeader
        title={tenant.name}
        description={
          <span className="font-mono text-xs">{tenant.slug}</span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={!tenant.active}
            onClick={() => {
              enterTenantView(tenant.id, tenant.name);
              queryClient.clear();
              router.push('/');
            }}
          >
            <LogIn className="h-4 w-4 mr-2" />
            View as Tenant
          </Button>
        }
      />

      {/* Settings card */}
      <div className="rounded-xl border border-border p-5 space-y-5">
        <h2 className="text-sm font-semibold">Settings</h2>

        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Status</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tenant.active ? 'Active — tenants can log in.' : 'Inactive — login is blocked.'}
            </p>
          </div>
          <Button
            variant={tenant.active ? 'destructive' : 'outline'}
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ active: !tenant.active })}
          >
            {tenant.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Plan Tier</Label>
          <div className="flex items-center gap-2">
            <Select
              value={effectivePlan}
              onValueChange={(v) => setPlanTier(v as typeof PLAN_TIERS[number])}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_TIERS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {planTier && planTier !== tenant.planTier && (
              <Button
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ planTier: effectivePlan })}
              >
                Save
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-1 border-t border-border">
          <div className="flex-1 rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Users</p>
            <p className="text-2xl font-semibold tabular-nums">{tenant._count.users}</p>
          </div>
          <div className="flex-1 rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Cases</p>
            <p className="text-2xl font-semibold tabular-nums">{tenant._count.cases}</p>
          </div>
        </div>
      </div>

      {/* Users in this tenant */}
      {/* <div className="rounded-md border">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">Users</h2>
          <Link href={`/super-admin/users/new?tenantId=${id}`}>
            <Button variant="outline" size="sm">Add User</Button>
          </Link>
        </div>
        {usersLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No users in this tenant yet.</p>
        ) : (
          <div className="divide-y">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/super-admin/users/${u.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{u.role.replace('_', ' ')}</Badge>
                  {!u.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}
