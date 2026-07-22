'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, Circle, Clock, CheckCircle2, Ban, Check } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format-date';
import {
  initVeteranChecklist,
  getVeteranChecklist,
  updateVeteranBenefitItem,
} from '@/lib/api/veteran-benefits';
import { apiClient } from '@/lib/api/client';
import type { IVeteranBenefitItem } from '@/types';

type Status = IVeteranBenefitItem['status'];
type Tone = 'default' | 'info' | 'success' | 'warning';

const COLUMNS: { status: Status; title: string; icon: React.ReactNode; tone: Tone }[] = [
  { status: 'pending', title: 'Pending', icon: <Circle className="h-4 w-4" />, tone: 'default' },
  { status: 'in_progress', title: 'In Progress', icon: <Clock className="h-4 w-4" />, tone: 'info' },
  { status: 'completed', title: 'Completed', icon: <CheckCircle2 className="h-4 w-4" />, tone: 'success' },
  { status: 'waived', title: 'Waived', icon: <Ban className="h-4 w-4" />, tone: 'warning' },
];

const TONE_HEADER: Record<Tone, string> = {
  default: 'bg-muted/20',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
};

const TONE_BORDER: Record<Tone, string> = {
  default: 'border-l-transparent',
  info: 'border-l-blue-500 bg-blue-50/30',
  success: 'border-l-green-500 bg-green-50/30',
  warning: 'border-l-amber-500 bg-amber-50/30',
};

function BenefitRow({
  item,
  caseId,
}: {
  item: IVeteranBenefitItem;
  caseId: string;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '');

  const tone = COLUMNS.find((c) => c.status === item.status)?.tone ?? 'default';
  const isDone = item.status === 'completed';

  const updateMutation = useMutation({
    mutationFn: (dto: { status?: Status; notes?: string }) => updateVeteranBenefitItem(item.id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veteran-benefits', caseId] });
      toast.success('Item updated.');
    },
    onError: () => toast.error('Failed to update item.'),
  });

  return (
    <div className={cn('px-4 py-3 border-l-2', TONE_BORDER[tone])}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => updateMutation.mutate({ status: isDone ? 'pending' : 'completed' })}
          disabled={updateMutation.isPending}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          className={cn(
            'mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
            isDone
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-muted-foreground/40 hover:border-primary',
          )}
        >
          {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm', isDone && 'text-muted-foreground line-through')}>
            {item.benefitName}
          </p>

          {isDone && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed {item.completedAt ? formatDate(item.completedAt) : formatDate(item.updatedAt)}
              {item.completedBy && ` by ${item.completedBy}`}
            </p>
          )}

          {item.notes && !expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            {expanded ? 'Hide notes' : 'Add / edit notes'}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              <Textarea
                rows={2}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Notes..."
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ notes: notesDraft })}
                  disabled={updateMutation.isPending}
                >
                  Save Notes
                </Button>
                {item.status !== 'waived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ status: 'waived' })}
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
}

function BenefitColumn({
  title,
  icon,
  tone,
  items,
  caseId,
}: {
  title: string;
  icon: React.ReactNode;
  tone: Tone;
  items: IVeteranBenefitItem[];
  caseId: string;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium', TONE_HEADER[tone])}>
        {icon}
        <span>{title}</span>
        <span className="text-xs font-normal opacity-70">({items.length})</span>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <BenefitRow key={item.id} item={item} caseId={caseId} />
        ))}
      </div>
    </div>
  );
}

function VeteranBenefitsPanel({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['veteran-benefits', caseId],
    queryFn: () => getVeteranChecklist(caseId),
    retry: false,
    enabled: !!caseData?.veteranStatus,
  });

  const initMutation = useMutation({
    mutationFn: () => initVeteranChecklist(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veteran-benefits', caseId] });
      toast.success('VA benefits checklist initialized.');
    },
    onError: () => toast.error('Failed to initialize checklist.'),
  });

  if (!caseData?.veteranStatus) {
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
  const percent = list.length ? Math.round((completed / list.length) * 100) : 0;

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
      <div>
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="font-medium">{completed} of {list.length} benefits completed</span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => (
          <BenefitColumn
            key={col.status}
            title={col.title}
            icon={col.icon}
            tone={col.tone}
            items={list.filter((i) => i.status === col.status)}
            caseId={caseId}
          />
        ))}
      </div>
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
