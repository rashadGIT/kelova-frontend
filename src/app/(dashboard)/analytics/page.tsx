'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyPerformance, getBenchmarks } from '@/lib/api/analytics';

function percentile(mine: number | null, median: number | null): number | null {
  if (mine === null || median === null || median === 0) return null;
  return Math.min(Math.round((mine / median) * 50), 100);
}

interface KpiCardProps {
  label: string;
  mine: number | null;
  median: number | null;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
  unit?: string;
}

function KpiCard({ label, mine, median, format: fmt, higherIsBetter = true, unit = '' }: KpiCardProps) {
  const display = (v: number | null) =>
    v === null ? '—' : fmt ? fmt(v) : `${v.toLocaleString()}${unit}`;

  const pct = percentile(mine, median);
  const ahead = mine !== null && median !== null
    ? (higherIsBetter ? mine >= median : mine <= median)
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{display(mine)}</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Peer median: {display(median)}</span>
            {ahead !== null && (
              <span className={ahead ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                {ahead ? 'Above avg' : 'Below avg'}
              </span>
            )}
          </div>
          {pct !== null && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${ahead ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: perf, isLoading: perfLoading } = useQuery({
    queryKey: ['my-performance'],
    queryFn: getMyPerformance,
  });

  const { data: bench, isLoading: benchLoading } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: getBenchmarks,
  });

  const loading = perfLoading || benchLoading;

  const usd = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" hideTitle />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Your Performance vs. Peers
              {bench && <span className="normal-case ml-1 font-normal">({bench.peerCount} funeral homes)</span>}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Cases This Month"
                mine={perf?.casesThisMonth ?? null}
                median={bench?.medianCasesPerMonth ?? null}
              />
              <KpiCard
                label="Avg Time to Close"
                mine={perf?.avgTimeToCloseDays ?? null}
                median={bench?.medianAvgTimeToCloseDays ?? null}
                unit=" days"
                higherIsBetter={false}
              />
              <KpiCard
                label="Task Completion Rate"
                mine={perf?.taskCompletionRate ?? null}
                median={bench?.medianTaskCompletionRate ?? null}
                unit="%"
              />
              <KpiCard
                label="Avg Case Value"
                mine={perf?.avgCaseValue ?? null}
                median={bench?.medianAvgCaseValue ?? null}
                format={usd}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{perf?.totalCases?.toLocaleString() ?? '—'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {perf?.totalRevenue !== undefined ? usd(perf.totalRevenue) : '—'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Peer Network Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bench?.peerCount ?? '—'}</div>
                <p className="text-xs text-muted-foreground mt-1">Benchmarked funeral homes</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
