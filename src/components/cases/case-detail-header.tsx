'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/dashboard/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseStatusBadge } from './case-status-badge';
import { getCaseById, updateCaseStatus } from '@/lib/api/cases';
import { CaseStatus, type ICase } from '@/types';

const nextStatus: Partial<Record<CaseStatus, CaseStatus>> = {
  [CaseStatus.new]: CaseStatus.in_progress,
  [CaseStatus.in_progress]: CaseStatus.completed,
  [CaseStatus.completed]: CaseStatus.archived,
};

export function CaseDetailHeader({ caseId, initialData }: { caseId: string; initialData?: ICase }) {
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
    initialData,
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

  if (isLoading) return <Skeleton className="h-9 w-64" />;
  if (!caseData) return null;

  const advanceStatus = nextStatus[caseData.status];

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-xl font-semibold truncate">{caseData.deceasedName}</h1>
        <CaseStatusBadge status={caseData.status} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {advanceStatus && (
          <Button
            size="sm"
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate(advanceStatus)}
          >
            Mark {advanceStatus.replace('_', ' ')}
          </Button>
        )}
      </div>
    </div>
  );
}
