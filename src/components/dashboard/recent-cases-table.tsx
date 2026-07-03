'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { getRecentCases } from '@/lib/api/dashboard';
import { formatRelative } from '@/lib/utils/format-date';
import { CaseStatus } from '@/types';
import { toast } from 'sonner';

export function RecentCasesTable() {
  const router = useRouter();
  const { data: raw, isLoading } = useQuery({
    queryKey: ['recent-cases'],
    queryFn: getRecentCases,
  });
  const cases = Array.isArray(raw) ? raw : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Cases</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cases.length === 0) {
    const slug = '[slug]';
    const intakeUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/intake/${slug}`
      : `/intake/${slug}`;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Cases</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-3">
            <FolderOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground text-sm">No cases yet.</p>
            <p className="text-sm text-muted-foreground">Share your intake form link to get started.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(intakeUrl);
                toast.success('Intake link copied to clipboard.');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Intake Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Cases</CardTitle>
          <Link href="/cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium pl-6">Deceased</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium hidden sm:table-cell">Assigned</TableHead>
                <TableHead className="font-medium hidden sm:table-cell pr-6">Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:bg-muted"
                  tabIndex={0}
                  onClick={() => router.push(`/cases/${c.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/cases/${c.id}`); } }}
                >
                  <TableCell className="font-medium pl-6">{c.deceasedName}</TableCell>
                  <TableCell><CaseStatusBadge status={c.status as CaseStatus} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{c.assignedTo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell pr-6">{formatRelative(c.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
