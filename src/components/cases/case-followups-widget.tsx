'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils/cn';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';

const TEMPLATE_ORDER = ['one_week', 'one_month', 'six_month', 'one_year'] as const;

const LABEL: Record<string, string> = {
  one_week: '1 Week',
  one_month: '1 Month',
  six_month: '6 Months',
  one_year: '1 Year',
};

function getStatusKind(status: string, scheduledAt: string | null): 'sent' | 'pending' | 'overdue' {
  if (status === 'sent') return 'sent';
  if (status === 'pending' && scheduledAt && new Date(scheduledAt) < new Date()) return 'overdue';
  return 'pending';
}

function sortByTemplateOrder(followUps: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...followUps].sort((a, b) => {
    const aTemplate = String(a.templateType ?? a.template ?? '');
    const bTemplate = String(b.templateType ?? b.template ?? '');
    return TEMPLATE_ORDER.indexOf(aTemplate as (typeof TEMPLATE_ORDER)[number]) -
      TEMPLATE_ORDER.indexOf(bTemplate as (typeof TEMPLATE_ORDER)[number]);
  });
}

/** The next follow-up that hasn't gone out yet, soonest scheduled date first. Falls back to the last item if everything's already sent. */
function nextScheduled(followUps: Record<string, unknown>[]): Record<string, unknown> | undefined {
  const sorted = sortByTemplateOrder(followUps);
  return sorted.find((f) => String(f.status ?? '') !== 'sent') ?? sorted[sorted.length - 1];
}

function FollowUpRow({ followUp }: { followUp: Record<string, unknown> }) {
  const scheduledDate = (followUp.scheduledAt ?? followUp.scheduledFor ?? null) as string | null;
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">
          {LABEL[String(followUp.templateType ?? followUp.template)] ??
            String(followUp.templateType ?? followUp.template ?? '')}
        </span>
        <span className="text-xs text-muted-foreground">
          {scheduledDate ? formatDate(scheduledDate) : 'Date TBD'}
        </span>
      </div>
      <StatusPill kind={getStatusKind(String(followUp.status ?? ''), scheduledDate)} />
    </div>
  );
}

export function CaseFollowUpsWidget({ caseId }: { caseId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['followUps', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/follow-ups`).then((r) => r.data),
  });

  const upcoming = nextScheduled(followUps);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Grief Follow-ups</CardTitle>
        {followUps.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse follow-ups' : 'Expand follow-ups'}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', !expanded && 'rotate-90')} />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : followUps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No follow-ups scheduled yet.</p>
        ) : expanded ? (
          <div className="flex flex-col divide-y divide-border/60">
            {sortByTemplateOrder(followUps).map((f) => (
              <FollowUpRow key={f.id as string} followUp={f} />
            ))}
          </div>
        ) : (
          upcoming && <FollowUpRow followUp={upcoming} />
        )}
      </CardContent>
    </Card>
  );
}
