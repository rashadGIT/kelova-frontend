'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWhiteboardColumns } from '@/lib/api/whiteboard';

export default function WhiteboardPage() {
  const { data: columns, isLoading } = useQuery({
    queryKey: ['whiteboard-columns'],
    queryFn: getWhiteboardColumns,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Whiteboard"
        description="Live Operations Board — real-time view of all active cases by stage"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : columns && columns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <Card key={col.id} className="min-h-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  {col.title}
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    {col.caseCount}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Cases will appear here
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['First Call', 'In Progress', 'Service Scheduled', 'Closed'].map((title, i) => (
            <Card key={i} className="min-h-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  {title}
                  <span className="ml-auto text-xs text-muted-foreground font-normal">0</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Cases will appear here
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
