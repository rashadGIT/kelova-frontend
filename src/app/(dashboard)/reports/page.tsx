'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getReports } from '@/lib/api/reports';
import { getArAging, type ArAgingBucket } from '@/lib/api/payments';
import { cn } from '@/lib/utils/cn';

const BUCKET_COLORS: Record<ArAgingBucket['label'], string> = {
  '0-30':  'text-green-700 bg-green-50 border-green-200',
  '31-60': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '61-90': 'text-orange-700 bg-orange-50 border-orange-200',
  '90+':   'text-red-700 bg-red-50 border-red-200',
};

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

function ArAgingTab() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ar-aging'],
    queryFn: getArAging,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-muted-foreground">Failed to load AR aging data.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.buckets.map((bucket) => (
          <div
            key={bucket.label}
            className={cn('rounded-lg border px-4 py-3', BUCKET_COLORS[bucket.label])}
          >
            <p className="text-xs font-medium opacity-70">{bucket.label} days</p>
            <p className="text-xl font-bold mt-0.5">{usd(bucket.totalOutstanding)}</p>
            <p className="text-xs opacity-60 mt-0.5">{bucket.caseCount} case{bucket.caseCount !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Total outstanding: <span className="font-semibold text-foreground">{usd(data.totalOutstanding)}</span>
      </div>

      {/* Case breakdown per bucket */}
      {data.buckets.map((bucket) =>
        bucket.cases.length === 0 ? null : (
          <div key={bucket.label}>
            <h3 className="text-sm font-medium mb-2">{bucket.label} Days Overdue</h3>
            <div className="rounded-xl border border-border divide-y divide-border/60">
              {bucket.cases.map((c) => (
                <div key={c.caseId} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link
                      href={`/cases/${c.caseId}/payments`}
                      className="text-sm font-medium hover:underline"
                    >
                      {c.deceasedName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.oldestUnpaidDays} days since oldest unpaid installment
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{usd(c.balance)}</p>
                    <p className="text-xs text-muted-foreground">
                      {usd(c.amountPaid)} of {usd(c.totalAmount)} paid
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports-library'],
    queryFn: getReports,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      <Tabs defaultValue="ar-aging">
        <TabsList>
          <TabsTrigger value="ar-aging">AR Aging</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="ar-aging" className="mt-6">
          <ArAgingTab />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No reports yet. Use the Builder tab to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    <Badge variant="outline" className="w-fit text-xs">{r.category}</Badge>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">Run</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-muted-foreground text-sm">
                Build custom reports by selecting entities, fields, and filters.
              </p>
              <Button asChild>
                <Link href="/reports/builder">Open Report Builder</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
