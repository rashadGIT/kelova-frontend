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
import { getPreneedCarriers } from '@/lib/api/settings';

export default function PreneedCarriersPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['preneed-carriers'],
    queryFn: getPreneedCarriers,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preneed Carriers"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add Carrier'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Carrier form coming soon. Fill in carrier name, contact email, phone, and API type.
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
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>API Type</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!carriers || carriers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No preneed carriers configured
                    </TableCell>
                  </TableRow>
                ) : (
                  carriers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.contactEmail}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.apiType}</TableCell>
                      <TableCell>{c.active ? 'Yes' : 'No'}</TableCell>
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
