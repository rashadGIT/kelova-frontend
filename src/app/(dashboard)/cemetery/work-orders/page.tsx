'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getWorkOrders } from '@/lib/api/cemetery-gis';

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
}

export default function CemeteryWorkOrdersPage() {
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['cemetery-work-orders'],
    queryFn: getWorkOrders,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Grounds Work Orders" />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Plot / Section</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!workOrders || workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No work orders
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.type}</TableCell>
                      <TableCell>{w.plotSection}</TableCell>
                      <TableCell>{w.assignedTo}</TableCell>
                      <TableCell>{w.scheduled}</TableCell>
                      <TableCell>{statusBadge(w.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
