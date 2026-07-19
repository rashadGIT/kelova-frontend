'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-l-2',
        overdue ? 'border-l-red-500 bg-red-50/40' : 'border-l-transparent',
        task.completed && 'opacity-60',
      )}
    >
      <label className="relative mt-0.5 shrink-0 h-5 w-5 cursor-pointer">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => mutation.mutate(e.target.checked)}
          disabled={mutation.isPending}
          className="peer sr-only"
        />
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
            'peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground',
            'border-muted-foreground/40 peer-hover:border-primary',
          )}
        >
          {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </label>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', task.completed && 'line-through')}>{task.title}</p>

        {task.completed ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed {formatDate(task.updatedAt)}
            {task.completedBy && ` by ${task.completedBy}`}
          </p>
        ) : task.dueDate ? (
          <p
            className={cn(
              'text-xs mt-0.5',
              overdue ? 'text-red-600 font-medium' : 'text-muted-foreground',
            )}
          >
            Due {formatDate(task.dueDate)} {overdue && '— Overdue'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
