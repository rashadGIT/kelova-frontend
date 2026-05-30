'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { Checkbox } from '@/components/ui/checkbox';
import { updateTask } from '@/lib/api/tasks';
import { formatDate, isOverdue } from '@/lib/utils/format-date';
import type { ITask } from '@/types';

export function TaskItem({ task, caseId }: { task: ITask; caseId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (completed: boolean) => updateTask(task.id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', caseId] });
      toast.success(task.completed ? 'Task reopened.' : 'Task completed.');
    },
  });

  const overdue = !task.completed && task.dueDate && isOverdue(task.dueDate);

  return (
    <div className={cn(
      'flex items-start gap-3 py-3 border-b last:border-0 transition-opacity',
      task.completed && 'opacity-50',
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => mutation.mutate(checked)}
        disabled={mutation.isPending}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', task.completed && 'line-through')}>{task.title}</p>
        {task.dueDate && (
          <p className={cn('text-xs mt-0.5', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            Due {formatDate(task.dueDate)}{overdue && ' — Overdue'}
          </p>
        )}
      </div>
    </div>
  );
}
