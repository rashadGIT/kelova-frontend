'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getReports } from '@/lib/api/reports';

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports-library'],
    queryFn: getReports,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
        </TabsList>

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
