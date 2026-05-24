'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, TrendingUp, FolderOpen, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMultiLocationSummary } from '@/lib/api/multi-location';

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
              value={`$${Number(data.totals.revenueTotal).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={TrendingUp}
            />
          </div>

          {/* Locations table */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Locations ({data.locations.length})
            </h2>
            <div className="rounded-md border divide-y">
              {data.locations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="flex items-center justify-between px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">{loc.displayName}</p>
                    <p className="text-xs text-muted-foreground">Tenant: {loc.tenantId}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Cases</p>
                      <p className="text-sm font-semibold">{loc.activeCases}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">This Month</p>
                      <p className="text-sm font-semibold">{loc.casesThisMonth}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold">
                        ${Number(loc.revenueTotal).toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
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
