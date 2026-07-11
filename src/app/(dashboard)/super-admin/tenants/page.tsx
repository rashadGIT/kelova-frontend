'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronRight } from 'lucide-react';
import { getAdminTenants, createAdminTenant, type AdminTenant } from '@/lib/api/admin';
import { extractErrorMessage } from '@/lib/utils/error-message';

const PLAN_TIERS = ['pilot', 'starter', 'growth', 'enterprise'] as const;

function CreateTenantDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [planTier, setPlanTier] = useState<typeof PLAN_TIERS[number]>('pilot');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createAdminTenant({ name, slug, planTier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast.success(`Funeral home "${name}" created.`);
      setOpen(false);
      setName('');
      setSlug('');
      onSuccess();
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err, 'Failed to create tenant')),
  });

  const autoSlug = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-medium"><Plus className="h-4 w-4" />New Funeral Home</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Funeral Home</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(autoSlug(e.target.value));
              }}
              placeholder="Sunrise Memorial Chapel"
            />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(autoSlug(e.target.value))}
              placeholder="sunrise-memorial"
            />
            <p className="text-xs text-muted-foreground">URL-safe, lowercase. Used for subdomain and intake URL.</p>
          </div>
          <div className="space-y-1">
            <Label>Plan</Label>
            <Select value={planTier} onValueChange={(v) => setPlanTier(v as typeof PLAN_TIERS[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_TIERS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!name || !slug || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Creating...' : 'Create Funeral Home'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TenantAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const palettes = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const color = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    pilot: 'bg-slate-100 text-slate-700',
    starter: 'bg-blue-100 text-blue-700',
    growth: 'bg-emerald-100 text-emerald-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${colors[plan] ?? 'bg-slate-100 text-slate-700'}`}>
      {plan}
    </span>
  );
}

function TenantRow({ tenant }: { tenant: AdminTenant }) {
  return (
    <Link
      href={`/super-admin/tenants/${tenant.id}`}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-card border border-border hover:border-slate-300 hover:shadow-md hover:bg-accent/40 transition-all duration-150 group cursor-pointer"
    >
      <TenantAvatar name={tenant.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{tenant.name}</p>
          {!tenant.active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">{tenant.slug}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <PlanBadge plan={tenant.planTier} />
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">{tenant._count.users} users · {tenant._count.cases} cases</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

export default function AdminTenantsPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: getAdminTenants,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Funeral Homes"
        hideTitle
        description="Manage all tenant accounts."
        action={<CreateTenantDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })} />}
      />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No funeral homes yet.</p>
      ) : (
        <div className="space-y-2">
          {tenants.map((t) => <TenantRow key={t.id} tenant={t} />)}
        </div>
      )}
    </div>
  );
}
