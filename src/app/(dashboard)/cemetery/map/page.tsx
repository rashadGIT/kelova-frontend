'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCemeterySections } from '@/lib/api/cemetery-gis';

export default function CemeteryMapPage() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['cemetery-sections'],
    queryFn: getCemeterySections,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cemetery Map" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : !sections || sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections configured</p>
            ) : (
              sections.map((s) => (
                <div key={s.id} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="text-green-600">{s.available} available</span>
                    <span className="text-red-600">{s.occupied} occupied</span>
                    <span className="text-yellow-600">{s.reserved} reserved</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Map area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-muted rounded-lg flex items-center justify-center h-96">
            <span className="text-muted-foreground text-sm">
              Map integration pending — Mapbox GL
            </span>
          </div>

          {/* Legend */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-green-500" />
                Available
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-red-500" />
                Occupied
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-yellow-400" />
                Reserved
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
