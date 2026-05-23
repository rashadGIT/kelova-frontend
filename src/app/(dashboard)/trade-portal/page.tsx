'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
import { getTradeCases, getTradePartners } from '@/lib/api/trade-portal';

export default function TradePortalPage() {
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['trade-cases'],
    queryFn: getTradeCases,
  });

  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['trade-partners'],
    queryFn: getTradePartners,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Trade Cremation Portal" />

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Incoming Cases</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {casesLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deceased Name</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!cases || cases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No incoming cases
                        </TableCell>
                      </TableRow>
                    ) : (
                      cases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.deceasedName}</TableCell>
                          <TableCell>{c.partner}</TableCell>
                          <TableCell>{c.serviceType}</TableCell>
                          <TableCell>{c.status}</TableCell>
                          <TableCell>{c.completed ?? '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {partnersLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Commission %</TableHead>
                      <TableHead>Portal Token</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!partners || partners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No partners yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      partners.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.partnerName}</TableCell>
                          <TableCell>{p.contact}</TableCell>
                          <TableCell>{p.commissionPct}%</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {p.portalToken}
                            </code>
                          </TableCell>
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
