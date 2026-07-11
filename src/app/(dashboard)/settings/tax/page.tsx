'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTaxSchedules } from '@/lib/api/settings';

export default function TaxSchedulesPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['tax-schedules'],
    queryFn: getTaxSchedules,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Schedules"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add Tax Schedule'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Tax Schedule</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="State Tax" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate (%)</label>
              <Input type="number" placeholder="8.5" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Applies To</label>
              <Input placeholder="All services" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City / State</label>
              <Input placeholder="Atlanta, GA" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective Date</label>
              <Input type="date" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Save Schedule</Button>
            </div>
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
                  <TableHead>Rate %</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>City / State</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!schedules || schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No tax schedules configured
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.rate}%</TableCell>
                      <TableCell>{s.appliesTo}</TableCell>
                      <TableCell>{s.cityState}</TableCell>
                      <TableCell>{s.effectiveDate}</TableCell>
                      <TableCell>{s.active ? 'Yes' : 'No'}</TableCell>
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
