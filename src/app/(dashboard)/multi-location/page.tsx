'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, TrendingUp, FolderOpen, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMultiLocationSummary } from '@/lib/api/multi-location';

function shortCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5 pb-4">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MultiLocationPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['multi-location-summary'],
    queryFn: getMultiLocationSummary,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Location"
        hideTitle
        description="Analytics and case summaries across all locations in your group."
      />

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No locations configured for your group</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Multi-location analytics are available once your account is linked to an owner group.
              Contact support to enable this feature.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Totals row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Active Cases"
              value={data.totals.activeCases}
              icon={FolderOpen}
            />
            <StatCard
              label="Cases This Month"
              value={data.totals.casesThisMonth}
              icon={Calendar}
            />
            <StatCard
              label="Total Revenue"
              value={shortCurrency(Number(data.totals.revenueTotal))}
              icon={TrendingUp}
            />
          </div>

          {/* Locations list */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Locations ({data.locations.length})
            </h2>
            <div className="space-y-3">
              {data.locations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="rounded-xl border border-border bg-card px-6 pt-5 pb-5"
                >
                  <p className="text-sm font-semibold">{loc.displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4 truncate">
                    Tenant: {loc.tenantId}
                  </p>
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Active Cases</p>
                      <p className="text-xl font-semibold">{loc.activeCases}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">This Month</p>
                      <p className="text-xl font-semibold">{loc.casesThisMonth}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Revenue</p>
                      <p className="text-xl font-semibold">{shortCurrency(Number(loc.revenueTotal))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
