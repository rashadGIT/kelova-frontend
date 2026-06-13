'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, ExternalLink } from 'lucide-react';
import {
  getAdminFeedback,
  type FeedbackCategory,
  type FeedbackStatus,
  type FeedbackItem,
} from '@/lib/api/feedback';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  general: 'General',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_VARIANTS: Record<FeedbackStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  in_review: 'secondary',
  resolved: 'outline',
  closed: 'outline',
};

const CATEGORY_VARIANTS: Record<FeedbackCategory, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bug: 'destructive',
  feature_request: 'default',
  general: 'secondary',
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [category, setCategory] = useState<FeedbackCategory | 'all'>('all');
  const [status, setStatus] = useState<FeedbackStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const filter = {
    ...(category !== 'all' && { category }),
    ...(status !== 'all' && { status }),
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-feedback', filter],
    queryFn: () => getAdminFeedback(filter),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div>
      <PageHeader title="Feedback Inbox" description={data ? `${data.total} submissions` : undefined} />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={category} onValueChange={v => { setCategory(v as FeedbackCategory | 'all'); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={v => { setStatus(v as FeedbackStatus | 'all'); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitter</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Page</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">ClickUp</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.items.map((item: FeedbackItem) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`/super-admin/feedback/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <Badge variant={CATEGORY_VARIANTS[item.category]}>
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.submitterName ?? 'Anonymous'}</p>
                      {item.submitterEmail && (
                        <p className="text-muted-foreground text-xs">{item.submitterEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-[200px]">
                      {item.pageUrl ? (
                        <span className="truncate block text-muted-foreground text-xs" title={item.pageUrl}>
                          {item.pageUrl.replace(/^https?:\/\/[^/]+/, '')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {item.clickupTaskId ? (
                        <a
                          href={`https://app.clickup.com/t/${item.clickupTaskId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {data?.items.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No feedback submissions yet.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
