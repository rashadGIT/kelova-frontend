'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ShieldCheck, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { getPriceList, createPriceListItem, deletePriceListItem } from '@/lib/api/price-list';
import { apiClient } from '@/lib/api/client';
import { ExternalLink } from 'lucide-react';
import { PriceCategory } from '@/types';
import { useAdminStore } from '@/lib/store/admin.store';
import { useCurrentUser } from '@/hooks/use-current-user';

const categoryLabel: Record<PriceCategory, string> = {
  [PriceCategory.professional_services]: 'Professional Services',
  [PriceCategory.facilities]: 'Facilities',
  [PriceCategory.vehicles]: 'Vehicles',
  [PriceCategory.merchandise]: 'Merchandise',
  [PriceCategory.other]: 'Other',
};

export default function PriceListPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { activeTenantId } = useAdminStore();
  const { user } = useCurrentUser();

  useEffect(() => {
    apiClient.post('/price-list/view').catch(() => {/* non-blocking */});
  }, []);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<PriceCategory>(PriceCategory.professional_services);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['price-list'], queryFn: getPriceList });
  const { data: settings } = useQuery({
    queryKey: ['settings', activeTenantId ?? user?.tenantId],
    queryFn: () => apiClient.get<{ slug: string }>('/settings').then((r) => r.data),
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: () => createPriceListItem({ name, category, price: parseFloat(price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      toast.success('Item added.');
      setOpen(false);
      setName(''); setPrice('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceListItem,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['price-list'] }); toast.success('Item removed.'); },
  });

  const [complianceResult, setComplianceResult] = useState<{
    compliant: boolean;
    missing: string[];
    warnings: string[];
  } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const handleComplianceCheck = async () => {
    setComplianceLoading(true);
    try {
      const res = await apiClient.get<{ compliant: boolean; missing: string[]; warnings: string[] }>('/price-list/compliance');
      setComplianceResult(res.data);
    } catch {
      toast.error('Failed to run compliance check.');
    } finally {
      setComplianceLoading(false);
    }
  };

  // Group by category
  const grouped = Object.values(PriceCategory).reduce<Record<PriceCategory, typeof items>>(
    (acc, cat) => ({ ...acc, [cat]: items.filter((i) => i.category === cat) }),
    {} as Record<PriceCategory, typeof items>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price List"
        description="FTC General Price List — manage categories and items."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {settings?.slug && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/p/${settings.slug}/prices`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />View Public Page
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/price-list/audit"><ShieldCheck className="h-4 w-4 mr-2" />Compliance Log</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleComplianceCheck} disabled={complianceLoading}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              {complianceLoading ? 'Checking...' : 'FTC Check'}
            </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Price List Item</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="font-medium">Item Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Direct Cremation" />
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as PriceCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PriceCategory).map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Price ($)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <Button className="w-full" disabled={!name || !price || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      {/* GPL Compliance result panel */}
      {complianceResult && (
        <div className={`rounded-md border p-4 space-y-3 relative ${complianceResult.compliant ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <button onClick={() => setComplianceResult(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {complianceResult.compliant ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${complianceResult.compliant ? 'text-green-700' : 'text-red-700'}`}>
              {complianceResult.compliant
                ? 'Price list meets FTC Funeral Rule requirements.'
                : `${complianceResult.missing.length} required categor${complianceResult.missing.length === 1 ? 'y' : 'ies'} missing.`}
            </p>
          </div>
          {complianceResult.missing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Missing required categories:</p>
              <ul className="space-y-1">
                {complianceResult.missing.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-xs text-red-700">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />{m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {complianceResult.warnings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">Warnings:</p>
              <ul className="space-y-1">
                {complianceResult.warnings.map((w) => (
                  <li key={w} className="flex items-center gap-2 text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) =>
          catItems.length === 0 ? null : (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {categoryLabel[cat as PriceCategory]}
              </h3>
              <div className="rounded-xl border border-border divide-y divide-border/60">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <p className="text-sm font-medium flex-1 min-w-0">{item.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium tabular-nums">${Number(item.price).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )
      )}

    </div>
  );
}
