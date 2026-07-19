'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Circle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/dashboard/ui/button';
import { cn } from '@/lib/utils/cn';
import { isOverdue } from '@/lib/utils/format-date';
import { TaskItem } from './task-item';
import { getCaseTasks } from '@/lib/api/tasks';
import type { ITask } from '@/types';

function bySoonestDue(a: ITask, b: ITask) {
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

function TaskColumn({
  title,
  icon,
  tasks,
  caseId,
  tone = 'default',
}: {
  title: string;
  icon: React.ReactNode;
  tasks: ITask[];
  caseId: string;
  tone?: 'danger' | 'default' | 'muted' | 'success';
}) {
  // if (tasks.length === 0) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
          tone === 'danger' && 'bg-red-50 text-red-700',
          tone === 'success' && 'bg-green-50 text-green-700',
          tone === 'muted' && 'bg-muted/40 text-muted-foreground',
          tone === 'default' && 'bg-muted/20',
        )}
      >
        {icon}
        <span>{title}</span>
        <span className="text-xs font-normal opacity-70">({tasks.length})</span>
      </div>
      <div className="divide-y divide-border/60">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} caseId={caseId} />
        ))}
      </div>
    </div>
  );
}

export function TaskList({ caseId }: { caseId: string }) {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', caseId],
    queryFn: () => getCaseTasks(caseId),
  });

  const { overdue, upcoming, completed, completedCount, percent } = useMemo(() => {
    const open = tasks.filter((t) => !t.completed);
    const overdueTasks = open.filter((t) => t.dueDate && isOverdue(t.dueDate)).sort(bySoonestDue);
    const upcomingTasks = open
      .filter((t) => !t.dueDate || !isOverdue(t.dueDate))
      .sort(bySoonestDue);
    const completedTasks = tasks.filter((t) => t.completed);
    return {
      overdue: overdueTasks,
      upcoming: upcomingTasks,
      completed: completedTasks,
      completedCount: completedTasks.length,
      percent: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (error) return (
    <div className="rounded-xl border border-border p-4 text-center space-y-2">
      <p className="text-sm text-muted-foreground">Failed to load tasks.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No tasks for this case.</p>;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="font-medium">{completedCount} of {tasks.length} tasks completed</span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <TaskColumn
          title="Overdue"
          icon={<AlertTriangle className="h-4 w-4" />}
          tasks={overdue}
          caseId={caseId}
          tone="danger"
        />
        <TaskColumn
          title="Upcoming"
          icon={<Circle className="h-4 w-4" />}
          tasks={upcoming}
          caseId={caseId}
          tone="default"
        />
        <TaskColumn
          title="Completed"
          icon={<CheckCircle2 className="h-4 w-4" />}
          tasks={completed}
          caseId={caseId}
          tone="success"
        />
      </div>
    </div>
  );
}
