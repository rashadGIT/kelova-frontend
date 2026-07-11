'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDispatchAssignments } from '@/lib/api/dispatch';

function statusBadge(status: string) {
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
  if (status === 'en_route') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En Route</Badge>;
  if (status === 'completed') return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function DispatchPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['dispatch-assignments'],
    queryFn: getDispatchAssignments,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Assignment'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Assignment form coming soon. Fill in type, case, assignee, and schedule.
            </p>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Case</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!assignments || assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No assignments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.type}</TableCell>
                      <TableCell>{a.caseName}</TableCell>
                      <TableCell>{a.assignedTo}</TableCell>
                      <TableCell>{a.scheduled}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
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
