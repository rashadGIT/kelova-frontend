'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getInsurance } from '@/lib/api/case-extras';

const STATUSES = ['pending', 'submitted', 'approved', 'funded'] as const;
type InsuranceStatus = typeof STATUSES[number];

function statusColor(s: InsuranceStatus, current: InsuranceStatus) {
  const idx = STATUSES.indexOf(s);
  const curIdx = STATUSES.indexOf(current);
  if (idx < curIdx) return 'bg-green-500';
  if (idx === curIdx) return 'bg-primary';
  return 'bg-muted';
}

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function InsurancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: insurance, isLoading } = useQuery({
    queryKey: ['insurance', id],
    queryFn: () => getInsurance(id),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Assignment"
        action={<Button variant="outline">Lookup Policy</Button>}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Claim Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {STATUSES.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-3 w-3 rounded-full ${statusColor(s, insurance?.status ?? 'pending')}`}
                      />
                      <span className="text-xs capitalize text-muted-foreground">{s}</span>
                    </div>
                    {i < STATUSES.length - 1 && (
                      <div className="flex-1 h-px bg-muted mx-1 mb-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Policy Details</CardTitle>
                {insurance?.status && (
                  <Badge variant="outline" className="capitalize">{insurance.status}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Insured Name</label>
                <Input defaultValue={insurance?.insuredName ?? ''} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Insurance Company</label>
                <Input defaultValue={insurance?.insuranceCompany ?? ''} placeholder="Company name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Policy Number</label>
                <Input defaultValue={insurance?.policyNumber ?? ''} placeholder="Policy #" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Face Value</label>
                <Input
                  type="number"
                  defaultValue={insurance?.faceValue ?? ''}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Claimant Name</label>
                <Input defaultValue={insurance?.claimantName ?? ''} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Relationship to Deceased</label>
                <Input defaultValue={insurance?.relationship ?? ''} placeholder="Spouse, child..." />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <Button>Save Changes</Button>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <select className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {insurance && (
            <div className="text-sm text-muted-foreground">
              Estimated payout: <span className="font-medium text-foreground">{usd(insurance.faceValue)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
