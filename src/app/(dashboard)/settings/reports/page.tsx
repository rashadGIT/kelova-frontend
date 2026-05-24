'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getScheduledReports } from '@/lib/api/settings';

export default function ScheduledReportsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: getScheduledReports,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Reports"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add Report Schedule'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Report schedule form coming soon. Configure name, type, recipients, and cadence.
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!reports || reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No scheduled reports configured
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.recipients}</TableCell>
                      <TableCell>{r.cadence}</TableCell>
                      <TableCell>{r.lastSent ?? '—'}</TableCell>
                      <TableCell>{r.active ? 'Yes' : 'No'}</TableCell>
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
