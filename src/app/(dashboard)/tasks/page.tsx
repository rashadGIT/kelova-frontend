'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { getAllOpenTasks, type ITaskWithCase } from '@/lib/api/tasks';
import { updateTask } from '@/lib/api/tasks';
import { formatDate, isOverdue } from '@/lib/utils/format-date';

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function TaskRow({ task }: { task: ITaskWithCase }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (completed: boolean) => updateTask(task.id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-all'] });
      toast.success('Task completed.');
    },
  });

  const overdue = task.dueDate && isOverdue(task.dueDate);

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b last:border-0">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => mutation.mutate(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.case && (
            <Link
              href={`/cases/${task.case.id}`}
              className="text-xs text-muted-foreground hover:underline truncate max-w-[160px]"
            >
              {task.case.deceasedName}
            </Link>
          )}
          {task.dueDate && (
            <span className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
              {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, tasks, badge, badgeVariant }: {
  title: string;
  tasks: ITaskWithCase[];
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        {badge && <Badge variant={badgeVariant ?? 'secondary'}>{badge}</Badge>}
      </div>
      <div className="rounded-md border divide-y bg-card">
        {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: getAllOpenTasks,
  });

  const overdue = tasks.filter((t) => t.dueDate && isOverdue(t.dueDate));
  const today = tasks.filter((t) => t.dueDate && isToday(t.dueDate) && !isOverdue(t.dueDate));
  const upcoming = tasks.filter((t) => !t.dueDate || (!isOverdue(t.dueDate) && !isToday(t.dueDate)));

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Tasks" />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md border p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Failed to load tasks.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No open tasks.</p>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          <Section title="Overdue" tasks={overdue} badge={String(overdue.length)} badgeVariant="destructive" />
          <Section title="Due Today" tasks={today} badge={String(today.length)} />
          <Section title="Upcoming" tasks={upcoming} />
        </div>
      )}
    </div>
  );
}
