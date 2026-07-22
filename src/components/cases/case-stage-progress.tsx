'use client';

import { CaseStage } from '@/types';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/dashboard/ui/button';

const STAGES: CaseStage[] = [
  CaseStage.FirstCall,
  CaseStage.ArrangementScheduled,
  CaseStage.ArrangementComplete,
  CaseStage.InPreparation,
  CaseStage.ServicesScheduled,
  CaseStage.ServicesComplete,
  CaseStage.DeathCertFiled,
  CaseStage.Closed,
];

const STAGE_LABELS: Record<CaseStage, string> = {
  [CaseStage.FirstCall]: 'First Call',
  [CaseStage.ArrangementScheduled]: 'Arrangement Scheduled',
  [CaseStage.ArrangementComplete]: 'Arrangements Complete',
  [CaseStage.InPreparation]: 'In Preparation',
  [CaseStage.ServicesScheduled]: 'Services Scheduled',
  [CaseStage.ServicesComplete]: 'Services Complete',
  [CaseStage.DeathCertFiled]: 'Death Certificate Filed',
  [CaseStage.Closed]: 'Closed',
};

interface CaseStageProgressProps {
  stage: CaseStage;
  onAdvance?: (next: CaseStage) => void;
  isPending?: boolean;
  /** Compact mode for narrow containers (e.g. the case-detail sidebar rail). */
  compact?: boolean;
  /** When true, render only the current stage's row (no connectors, no Advance button). */
  collapsed?: boolean;
}

export function CaseStageProgress({ stage, onAdvance, isPending, compact, collapsed }: CaseStageProgressProps) {
  const currentIndex = STAGES.indexOf(stage);
  const nextStage = STAGES[currentIndex + 1] ?? null;

  if (collapsed && currentIndex === -1) return null;

  const visibleStages = collapsed ? STAGES.filter((_, i) => i === currentIndex) : STAGES;

  return (
    <div className="space-y-0">
      {!compact && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
          Progress
        </p>
      )}
      {visibleStages.map((s) => {
        const i = STAGES.indexOf(s);
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = collapsed || i === STAGES.length - 1;

        return (
          <div key={s}>
            <div className="flex items-center gap-3">
              {/* Circle indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'rounded-full flex-shrink-0 transition-all',
                    isCompleted && 'w-3 h-3 bg-primary',
                    isCurrent && 'w-3.5 h-3.5 bg-primary ring-2 ring-primary ring-offset-2',
                    !isCompleted && !isCurrent && 'w-3 h-3 border-2 border-muted-foreground/30 bg-background',
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm py-1',
                  isCompleted && 'text-muted-foreground',
                  isCurrent && 'text-foreground font-medium',
                  !isCompleted && !isCurrent && 'text-muted-foreground/60',
                )}
              >
                {STAGE_LABELS[s]}
                {isCurrent && (
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(current)</span>
                )}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex items-start gap-3">
                <div className="flex justify-center" style={{ width: '0.875rem' }}>
                  <div
                    className={cn(
                      'w-px h-4',
                      i < currentIndex ? 'bg-primary' : 'bg-border',
                    )}
                  />
                </div>
                {/* Advance button appears between current and next step (only when a handler is wired up) */}
                {isCurrent && nextStage && onAdvance && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs mt-0.5"
                    disabled={isPending}
                    onClick={() => onAdvance(nextStage)}
                  >
                    Advance to {STAGE_LABELS[nextStage]}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
