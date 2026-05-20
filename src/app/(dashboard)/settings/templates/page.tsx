'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown, ChevronUp, ChevronRight, Pencil, Plus, RotateCcw, Trash2, Check, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ServiceType } from '@/types';

type TemplateItem = {
  id: string;
  title: string;
  defaultDueDays: number | null;
  position: number;
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.burial]: 'Burial',
  [ServiceType.cremation]: 'Cremation',
  [ServiceType.graveside]: 'Graveside',
  [ServiceType.memorial]: 'Memorial',
};

function TemplateCard({
  serviceType,
  items,
  onSave,
  onReset,
  isSaving,
}: {
  serviceType: ServiceType;
  items: TemplateItem[];
  onSave: (serviceType: ServiceType, items: TemplateItem[]) => void;
  onReset: (serviceType: ServiceType) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState<TemplateItem[]>(items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync when parent items change (after save/reset)
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setLocalItems(items);
    setDirty(false);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...localItems];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setLocalItems(next.map((item, i) => ({ ...item, position: i })));
    setDirty(true);
  }

  function startEdit(item: TemplateItem) {
    setEditingId(item.id);
    setEditDraft(item.title);
  }

  function confirmEdit(id: string) {
    if (!editDraft.trim()) return;
    setLocalItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, title: editDraft.trim() } : item),
    );
    setEditingId(null);
    setDirty(true);
  }

  function removeItem(id: string) {
    setLocalItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, i) => ({ ...item, position: i })),
    );
    setDirty(true);
  }

  function addItem() {
    if (!newTitle.trim()) return;
    const newItem: TemplateItem = {
      id: `new-${Date.now()}`,
      title: newTitle.trim(),
      defaultDueDays: null,
      position: localItems.length,
    };
    setLocalItems((prev) => [...prev, newItem]);
    setNewTitle('');
    setAddingNew(false);
    setDirty(true);
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer select-none">
        <div
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm">{SERVICE_TYPE_LABELS[serviceType]}</span>
          <Badge variant="outline" className="text-xs">{localItems.length} tasks</Badge>
          {dirty && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
        </div>
        {open && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
              onClick={() => { onReset(serviceType); setDirty(false); }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset to default
            </Button>
            {dirty && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                disabled={isSaving}
                onClick={() => onSave(serviceType, localItems)}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        )}
      </div>

      {open && <div className="divide-y border-t">
        {localItems.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-2 group">
            <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>

            {editingId === item.id ? (
              <div className="flex items-center gap-1.5 flex-1">
                <Input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit(item.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-7 text-sm"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => confirmEdit(item.id)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <span className="text-sm flex-1">{item.title}</span>
            )}

            {editingId !== item.id && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(idx, 1)} disabled={idx === localItems.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {addingNew ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{localItems.length + 1}</span>
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
                if (e.key === 'Escape') { setAddingNew(false); setNewTitle(''); }
              }}
              placeholder="New task title…"
              className="h-7 text-sm flex-1"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={addItem}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingNew(false); setNewTitle(''); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>}
    </div>
  );
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<Record<ServiceType, TemplateItem[]>>({
    queryKey: ['task-templates'],
    queryFn: () => apiClient.get('/task-templates').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ serviceType, items }: { serviceType: ServiceType; items: TemplateItem[] }) =>
      apiClient.post(`/task-templates/${serviceType}`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template saved.');
    },
    onError: () => toast.error('Failed to save template.'),
  });

  const resetMutation = useMutation({
    mutationFn: (serviceType: ServiceType) =>
      apiClient.delete(`/task-templates/${serviceType}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template reset to defaults.');
    },
    onError: () => toast.error('Failed to reset template.'),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Task Templates"
        description="Default task checklists generated for each service type. Changes apply to new cases only."
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(ServiceType).map((type) => (
            <TemplateCard
              key={type}
              serviceType={type}
              items={templates?.[type] ?? []}
              onSave={(st, items) => saveMutation.mutate({ serviceType: st, items })}
              onReset={(st) => resetMutation.mutate(st)}
              isSaving={saveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
