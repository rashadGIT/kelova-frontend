'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/dashboard/ui/card';
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
import { getCemeteryAppointments } from '@/lib/api/cemetery-gis';

export default function CemeteryAppointmentsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['cemetery-appointments'],
    queryFn: getCemeteryAppointments,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Appointments"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Appointment'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Appointment form coming soon. Fill in prospect info and preferred date.
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
                  <TableHead>Prospect</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!appointments || appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No appointments scheduled
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.prospect}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.phone}</TableCell>
                      <TableCell>{a.scheduled}</TableCell>
                      <TableCell>{a.status}</TableCell>
                      <TableCell className="max-w-48 truncate">{a.notes}</TableCell>
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
