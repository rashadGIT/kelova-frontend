'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronRight } from 'lucide-react';
import { getAdminUsers, getAdminTenants, type AdminUser } from '@/lib/api/admin';

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    funeral_director: 'bg-blue-100 text-blue-700',
    staff: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${colors[role] ?? 'bg-slate-100 text-slate-700'}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <Link
      href={`/super-admin/users/${user.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{user.name}</p>
          {!user.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          <span className="text-xs text-muted-foreground shrink-0">{user.tenant.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <RoleBadge role={user.role} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default function AdminUsersPage() {
  const ALL = '__all__';
  const [tenantFilter, setTenantFilter] = useState<string>(ALL);

  const { data: tenants = [] } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: getAdminTenants,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', tenantFilter],
    queryFn: () => getAdminUsers(tenantFilter === ALL ? undefined : tenantFilter),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="All users across every funeral home."
        action={
          <Link href="/super-admin/users/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New User</Button>
          </Link>
        }
      />

      {/* Tenant filter */}
      <div className="flex items-center gap-2">
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All funeral homes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All funeral homes</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tenantFilter !== ALL && (
          <Button variant="ghost" size="sm" onClick={() => setTenantFilter(ALL)}>Clear</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border/60">
          {users.map((u) => <UserRow key={u.id} user={u} />)}
        </div>
      )}
    </div>
  );
}
