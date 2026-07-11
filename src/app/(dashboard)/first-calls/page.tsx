'use client';

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
import { getFirstCalls } from '@/lib/api/first-calls';

export default function FirstCallsPage() {
  const { data: calls, isLoading } = useQuery({
    queryKey: ['first-calls'],
    queryFn: getFirstCalls,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="First Calls" />

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
                  <TableHead>Caller</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Deceased</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!calls || calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No first calls recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.caller}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.deceased}</TableCell>
                      <TableCell>{c.time}</TableCell>
                      <TableCell>
                        {c.processed ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Processed</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Unprocessed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled={c.processed}>
                          Convert to Case
                        </Button>
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
