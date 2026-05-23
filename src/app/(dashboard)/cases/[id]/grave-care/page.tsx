'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { getGraveCareServices, getGraveCareOrders } from '@/lib/api/case-extras';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function GraveCarePage({ params }: { params: { id: string } }) {
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['grave-care-services'],
    queryFn: getGraveCareServices,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['grave-care-orders', params.id],
    queryFn: () => getGraveCareOrders(params.id),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Grave Care" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          {servicesLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !services || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grave care services available</p>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <p className="text-sm font-semibold mt-1">{usd(s.price)}</p>
                  </div>
                  <Button size="sm" variant="outline">Request Service</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!orders || orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No orders placed
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.serviceType}</TableCell>
                      <TableCell>{o.requestedDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{o.status}</Badge>
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
