'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, User, Heart, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { CaseStatusBadge } from './case-status-badge';
import { getCaseById, updateCaseStatus } from '@/lib/api/cases';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';
import { CaseStatus, ServiceType, type ICase, type IFamilyContact } from '@/types';

const nextStatus: Partial<Record<CaseStatus, CaseStatus>> = {
  [CaseStatus.new]: CaseStatus.in_progress,
  [CaseStatus.in_progress]: CaseStatus.completed,
  [CaseStatus.completed]: CaseStatus.archived,
};

const nextStatusLabel: Partial<Record<CaseStatus, string>> = {
  [CaseStatus.new]: 'Mark In Progress',
  [CaseStatus.in_progress]: 'Mark Completed',
  [CaseStatus.completed]: 'Archive',
};

const serviceTypeLabel: Record<ServiceType, string> = {
  [ServiceType.burial]: 'Burial',
  [ServiceType.cremation]: 'Cremation',
  [ServiceType.graveside]: 'Graveside',
  [ServiceType.memorial]: 'Memorial',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground w-24 shrink-0 pt-px">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function CaseOverview({ caseId, initialData }: { caseId: string; initialData?: ICase }) {
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
    initialData,
  });

  const { data: contacts } = useQuery<IFamilyContact[]>({
    queryKey: ['case-contacts', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/contacts`).then((r) => r.data),
    enabled: !!caseId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: CaseStatus) => updateCaseStatus(caseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Status updated.');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!caseData) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Case not found.</p>
        </CardContent>
      </Card>
    );
  }

  const advanceStatus = nextStatus[caseData.status];
  const primaryContact = contacts?.find((c) => c.isPrimaryContact) ?? contacts?.[0];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between space-y-0 gap-3 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">{caseData.deceasedName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {serviceTypeLabel[caseData.serviceType]} &middot; Created {formatDate(caseData.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CaseStatusBadge status={caseData.status} />
          {advanceStatus && (
            <Button
              size="sm"
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(advanceStatus)}
            >
              {nextStatusLabel[caseData.status]}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Deceased details */}
        <div className="space-y-2">
          {caseData.deceasedDob && (
            <DetailRow label="Born" value={formatDate(caseData.deceasedDob)} />
          )}
          {caseData.deceasedDod && (
            <DetailRow label="Died" value={formatDate(caseData.deceasedDod)} />
          )}
          {caseData.faithTradition && (
            <DetailRow
              label="Faith"
              value={
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  {caseData.faithTradition}
                </span>
              }
            />
          )}
          {caseData.overdueTaskCount !== undefined && caseData.overdueTaskCount > 0 && (
            <DetailRow
              label="Overdue"
              value={
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {caseData.overdueTaskCount} overdue task{caseData.overdueTaskCount !== 1 ? 's' : ''}
                </span>
              }
            />
          )}
        </div>

        {/* Primary contact */}
        {primaryContact && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Contact</p>
              <div className="flex items-start gap-2.5">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{primaryContact.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{primaryContact.relationship}</p>
                  {primaryContact.phone && (
                    <a
                      href={`tel:${primaryContact.phone}`}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      {primaryContact.phone}
                    </a>
                  )}
                  {primaryContact.email && (
                    <a
                      href={`mailto:${primaryContact.email}`}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      {primaryContact.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
