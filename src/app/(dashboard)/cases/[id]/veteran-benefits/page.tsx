'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, CheckCircle2, Circle } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  initVeteranChecklist,
  getVeteranChecklist,
  updateVeteranBenefitItem,
} from '@/lib/api/veteran-benefits';
import { apiClient } from '@/lib/api/client';
import type { IVeteranBenefitItem } from '@/types';

const STATUS_COLORS: Record<IVeteranBenefitItem['status'], string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  waived: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<IVeteranBenefitItem['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  waived: 'Waived',
};

function VeteranBenefitsPanel({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['veteran-benefits', caseId],
    queryFn: () => getVeteranChecklist(caseId),
    retry: false,
    enabled: !!caseData?.isVeteran,
  });

  const initMutation = useMutation({
    mutationFn: () => initVeteranChecklist(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veteran-benefits', caseId] });
      toast.success('VA benefits checklist initialized.');
    },
    onError: () => toast.error('Failed to initialize checklist.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      status,
      notes,
    }: {
      itemId: string;
      status?: IVeteranBenefitItem['status'];
      notes?: string;
    }) => updateVeteranBenefitItem(itemId, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veteran-benefits', caseId] });
      toast.success('Item updated.');
    },
    onError: () => toast.error('Failed to update item.'),
  });

  if (!caseData?.isVeteran) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Not marked as a veteran case</p>
            <p className="text-xs text-muted-foreground mt-1">
              Update the case info to enable VA benefits tracking for this decedent.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const list = items ?? [];
  const completed = list.filter((i) => i.status === 'completed').length;

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">VA benefits checklist not started</p>
            <p className="text-xs text-muted-foreground mt-1">
              Initialize the standard 10-item VA benefits checklist for this case.
            </p>
          </div>
          <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
            {initMutation.isPending ? 'Initializing...' : 'Initialize VA Benefits Checklist'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">VA Benefits Progress</p>
            <p className="text-sm text-muted-foreground">
              {completed} / {list.length} completed
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${list.length ? (completed / list.length) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Benefits Checklist</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {list.map((item) => {
            const isExpanded = expandedId === item.id;
            const isDone = item.status === 'completed';
            const notesDraft = notesMap[item.id] ?? item.notes ?? '';

            return (
              <div key={item.id} className="py-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        itemId: item.id,
                        status: isDone ? 'pending' : 'completed',
                      })
                    }
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.benefitName}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    {item.notes && !isExpanded && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.notes}
                      </p>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                    >
                      {isExpanded ? 'Hide notes' : 'Add / edit notes'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          rows={2}
                          value={notesDraft}
                          onChange={(e) =>
                            setNotesMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Notes..."
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateMutation.mutate({ itemId: item.id, notes: notesDraft })
                            }
                            disabled={updateMutation.isPending}
                          >
                            Save Notes
                          </Button>
                          {item.status !== 'waived' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateMutation.mutate({ itemId: item.id, status: 'waived' })
                              }
                              disabled={updateMutation.isPending}
                            >
                              Mark Waived
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseVeteranBenefitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <VeteranBenefitsPanel caseId={id} />
    </div>
  );
}
