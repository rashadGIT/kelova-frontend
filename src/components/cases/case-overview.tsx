'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCaseById } from '@/lib/api/cases';
import { formatDate } from '@/lib/utils/format-date';
import { dispositionTypeLabel } from '@/lib/utils/case-labels';
import { titleCase, tabHref, DetailBlockLink } from './case-detail-shared';
import type { ICase, ICaseTabSummary } from '@/types';

function DetailBlock({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function buildTabSummaryRows(caseId: string, summary: ICaseTabSummary, veteranStatus: boolean) {
  const rows: { label: string; value: string }[] = [
    {
      label: 'Tasks',
      value:
        summary.tasks.openCount === 0
          ? 'No open tasks'
          : `${summary.tasks.overdueCount} overdue / ${summary.tasks.openCount} open`,
    },
    {
      label: 'Payments',
      value:
        summary.payments.total === null
          ? 'Not set up'
          : `$${summary.payments.balanceDue?.toFixed(2)} due of $${summary.payments.total.toFixed(2)}`,
    },
    {
      label: 'Death Certificate',
      value: summary.deathCertificate.status ? titleCase(summary.deathCertificate.status) : 'Not started',
    },
    {
      label: 'Signatures',
      value: summary.signatures.pendingCount > 0 ? `${summary.signatures.pendingCount} pending` : 'None pending',
    },
    {
      label: 'Merchandise',
      value:
        summary.merchandise.itemCount > 0
          ? `${summary.merchandise.itemCount} items, $${summary.merchandise.total?.toFixed(2)}`
          : 'None selected',
    },
    {
      label: 'Accommodations',
      value: summary.accommodationPage.linkCount > 0 ? `${summary.accommodationPage.linkCount} links added` : 'None added',
    },
    {
      label: 'Photos',
      value: summary.photos.count > 0 ? `${summary.photos.count} photos` : 'None uploaded',
    },
    {
      label: 'Tracking',
      value: summary.tracking.status ? titleCase(summary.tracking.status) : 'Not set',
    },
  ];

  if (veteranStatus && summary.veteranBenefits) {
    rows.push({
      label: 'Veteran Benefits',
      value: `${summary.veteranBenefits.completedCount} of ${summary.veteranBenefits.totalCount} complete`,
    });
  }

  return rows.map((row) => ({ ...row, href: tabHref(caseId, row.label) }));
}

export function CaseOverview({ caseId, initialData }: { caseId: string; initialData?: ICase }) {
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
    initialData,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!caseData) return <div className="text-muted-foreground text-sm">Case not found.</div>;

  const informant = caseData.informantName
    ? caseData.informantRelationship
      ? `${caseData.informantName} (${caseData.informantRelationship})`
      : caseData.informantName
    : null;

  const tabSummaryRows = caseData.tabSummary
    ? buildTabSummaryRows(caseId, caseData.tabSummary, caseData.veteranStatus)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Deceased</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DetailBlock label="Full Name" value={caseData.deceasedName} />
          <DetailBlock
            label="Born – Died"
            value={
              caseData.deceasedDob && caseData.deceasedDod
                ? `${formatDate(caseData.deceasedDob)} - ${formatDate(caseData.deceasedDod)}`
                : null
            }
          />
          <DetailBlock label="Place of Death" value={caseData.placeOfDeath} />
          <DetailBlock
            label="Disposition"
            value={caseData.dispositionType ? dispositionTypeLabel[caseData.dispositionType] : null}
          />
          <DetailBlock label="Officiant" value={caseData.officiantName} />
          <DetailBlock label="Veteran Status" value={caseData.veteranStatus ? 'Yes' : null} />
          <DetailBlock label="Faith Tradition" value={caseData.faithTradition} />
          <DetailBlock
            label="Marital Status"
            value={caseData.maritalStatus ? titleCase(caseData.maritalStatus) : null}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DetailBlock label="Case Number" value={caseData.caseNumber} />
          <DetailBlock label="Created" value={formatDate(caseData.createdAt)} />
          <DetailBlock
            label="Arrangement Date"
            value={caseData.arrangementDate ? formatDate(caseData.arrangementDate) : null}
          />
          <DetailBlock label="Informant" value={informant} />
          {tabSummaryRows.map((row) => (
            <DetailBlockLink key={row.label} href={row.href} label={row.label} value={row.value} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
