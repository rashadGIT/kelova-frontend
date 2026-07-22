'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStoreProducts, getStoreOrders } from '@/lib/api/store';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function StorePage() {
  const [showProductForm, setShowProductForm] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products'],
    queryFn: getStoreProducts,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['store-orders'],
    queryFn: getStoreOrders,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tribute Store" />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowProductForm((v) => !v)}>
              {showProductForm ? 'Cancel' : 'Add Product'}
            </Button>
          </div>

          {showProductForm && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Product form coming soon. Fill in name, type, price, and commission.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {productsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!products || products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No products yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.type}</TableCell>
                          <TableCell>{usd(p.price)}</TableCell>
                          <TableCell>{p.commission}%</TableCell>
                          <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!orders || orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No orders yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.customer}</TableCell>
                          <TableCell>{o.product}</TableCell>
                          <TableCell>{usd(o.total)}</TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell>{o.date}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
