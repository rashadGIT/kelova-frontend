'use client';

import { type ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { CaseStageProgress } from './case-stage-progress';
import { SendIntakeFormButton } from './send-intake-form-button';
import { DetailBlockLink, titleCase, tabHref } from './case-detail-shared';
import { getCaseById } from '@/lib/api/cases';
import { formatDate } from '@/lib/utils/format-date';
import { serviceTypeLabel } from '@/lib/utils/case-labels';
import { DispositionType, type ICase } from '@/types';

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MilestoneItem({ label, completedAt }: { label: string; completedAt: string | null }) {
  const done = Boolean(completedAt);
  return (
    <div className="flex items-center gap-2 py-1">
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex flex-col">
        <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
        {done && <span className="text-xs text-muted-foreground">{formatDate(completedAt)}</span>}
      </div>
    </div>
  );
}

export function CaseDetailSidebar({ caseId, initialData }: { caseId: string; initialData?: ICase }) {
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
    initialData,
  });
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [serviceDetailsExpanded, setServiceDetailsExpanded] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!caseData) return null;

  const assignedTo = (caseData as ICase & { assignedTo?: { name?: string } | string }).assignedTo;
  const assignedToLabel = typeof assignedTo === 'object' ? assignedTo?.name : assignedTo;
  const primaryContact = caseData.familyContacts?.find((contact) => contact.isPrimaryContact);
  const secondaryContact = caseData.familyContacts?.find((contact) => !contact.isPrimaryContact);

  return (
    <div className="space-y-4">
      <SidebarSection title="Assigned To">
        <p className="text-sm text-foreground">{assignedToLabel || 'Unassigned'}</p>
      </SidebarSection>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Contacts</CardTitle>
          {primaryContact && (
            <button
              type="button"
              onClick={() => setContactsExpanded((expanded) => !expanded)}
              aria-expanded={contactsExpanded}
              aria-label={contactsExpanded ? 'Collapse contacts' : 'Expand contacts'}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', !contactsExpanded && 'rotate-90')}
              />
            </button>
          )}
        </CardHeader>
        <CardContent>
          {primaryContact ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-foreground font-medium">{primaryContact.name}</p>
                <SendIntakeFormButton caseId={caseId} />
              </div>
              {contactsExpanded && (
                <>
                  <p className="text-sm text-muted-foreground">{primaryContact.relationship}</p>
                  {primaryContact.phone && <p className="text-sm text-muted-foreground">{primaryContact.phone}</p>}
                  {primaryContact.email && <p className="text-sm text-muted-foreground">{primaryContact.email}</p>}
                  {secondaryContact && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      <span className="text-xs text-muted-foreground">Secondary Contact</span>
                      <p className="text-sm text-foreground font-medium">{secondaryContact.name}</p>
                      <p className="text-sm text-muted-foreground">{secondaryContact.relationship}</p>
                      {secondaryContact.phone && (
                        <p className="text-sm text-muted-foreground">{secondaryContact.phone}</p>
                      )}
                      {secondaryContact.email && (
                        <p className="text-sm text-muted-foreground">{secondaryContact.email}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" aria-disabled>No contacts yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Progress</CardTitle>
          <button
            type="button"
            onClick={() => setProgressExpanded((expanded) => !expanded)}
            aria-expanded={progressExpanded}
            aria-label={progressExpanded ? 'Collapse progress' : 'Expand progress'}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', !progressExpanded && 'rotate-90')}
            />
          </button>
        </CardHeader>
        <CardContent>
          <CaseStageProgress stage={caseData.stage} compact collapsed={!progressExpanded} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Service Details</CardTitle>
          <button
            type="button"
            onClick={() => setServiceDetailsExpanded((expanded) => !expanded)}
            aria-expanded={serviceDetailsExpanded}
            aria-label={serviceDetailsExpanded ? 'Collapse service details' : 'Expand service details'}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', !serviceDetailsExpanded && 'rotate-90')}
            />
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Service Type</span>
              <span className="text-sm text-foreground font-medium">{serviceTypeLabel[caseData.serviceType]}</span>
            </div>
            {caseData.tabSummary && (
              <DetailBlockLink
                href={tabHref(caseId, 'Arrangement')}
                label="Arrangement"
                value={
                  caseData.tabSummary.arrangementConference.heldAt
                    ? `Held ${formatDate(caseData.tabSummary.arrangementConference.heldAt)}`
                    : 'Not held yet'
                }
              />
            )}
            {serviceDetailsExpanded && caseData.tabSummary && (
              <>
                {caseData.dispositionType === DispositionType.cremation && (
                  <DetailBlockLink
                    href={tabHref(caseId, 'Cremation Auth')}
                    label="Cremation Auth"
                    value={
                      caseData.tabSummary.cremationAuthorization.status
                        ? titleCase(caseData.tabSummary.cremationAuthorization.status)
                        : 'Not started'
                    }
                  />
                )}
                <DetailBlockLink
                  href={tabHref(caseId, 'Cemetery')}
                  label="Cemetery"
                  value={caseData.tabSummary.cemeteryRecord.location ?? 'Not set'}
                />
                <DetailBlockLink
                  href={tabHref(caseId, 'Memorial')}
                  label="Memorial"
                  value={
                    caseData.tabSummary.memorialPage.published === null
                      ? 'Not created'
                      : caseData.tabSummary.memorialPage.published
                        ? 'Published'
                        : 'Draft'
                  }
                />
                <DetailBlockLink
                  href={tabHref(caseId, 'Obituary')}
                  label="Obituary"
                  value={
                    caseData.tabSummary.obituary.status
                      ? titleCase(caseData.tabSummary.obituary.status)
                      : 'Not started'
                  }
                />
                <DetailBlockLink
                  href={tabHref(caseId, 'Vendors')}
                  label="Vendors"
                  value={
                    caseData.tabSummary.vendorAssignments.count > 0
                      ? `${caseData.tabSummary.vendorAssignments.count} assigned`
                      : 'None assigned'
                  }
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <SidebarSection title="Milestones">
        <div className="space-y-1">
          <MilestoneItem label="Financial acknowledgment" completedAt={caseData.financialAckAt} />
          <MilestoneItem label="Family info submitted" completedAt={caseData.familyInfoSubmittedAt} />
          <MilestoneItem label="SS notified" completedAt={caseData.ssNotifiedAt} />
        </div>
      </SidebarSection>
    </div>
  );
}
