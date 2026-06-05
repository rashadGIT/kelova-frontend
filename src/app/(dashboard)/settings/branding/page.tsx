'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type Field = 'name' | 'googleReviewUrl';

export default function BrandingSettingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<Record<Field, string>>) => apiClient.patch('/settings', patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved.');
      setEditing(null);
    },
    onError: () => toast.error('Failed to save settings.'),
  });

  function startEdit(field: Field) {
    setDraft(settings?.[field] ?? '');
    setEditing(field);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft('');
  }

  function save(field: Field) {
    mutation.mutate({ [field]: draft });
  }

  const fields: { key: Field; label: string; hint?: string; placeholder?: string }[] = [
    { key: 'name', label: 'Funeral Home Name' },
    {
      key: 'googleReviewUrl',
      label: 'Google Review URL',
      hint: 'Used for automated review requests 14 days after service completion.',
      placeholder: 'https://g.page/...',
    },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Branding" description="Funeral home name and review link." />
      <div className="divide-y divide-border/60 rounded-xl border border-border">
        {fields.map(({ key, label, hint, placeholder }) => (
          <div key={key} className="px-4 py-4">
            <div className="flex items-center justify-between gap-4 mb-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {editing !== key && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => startEdit(key)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>

            {editing === key ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  autoFocus
                  value={draft}
                  placeholder={placeholder}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') save(key);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700"
                  disabled={mutation.isPending}
                  onClick={() => save(key)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={cancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm">
                {settings?.[key] || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}

            {hint && editing !== key && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
