'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { getRecentCases } from '@/lib/api/dashboard';
import { CaseStatus } from '@/types';

/**
 * Compact left-rail equivalent of GitHub's "Top repositories" block.
 * Shares the ['recent-cases'] query key with RecentCasesTable so React Query
 * dedupes the fetch instead of hitting the API twice on the same page.
 */
export function RecentCasesRail() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['recent-cases'],
    queryFn: getRecentCases,
  });
  const cases = Array.isArray(raw) ? raw : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cases yet.</p>
        ) : (
          <>
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="truncate flex-1">{c.deceasedName}</span>
                <CaseStatusBadge status={c.status as CaseStatus} />
              </Link>
            ))}
            <Link
              href="/cases"
              className="block pt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Show more →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
