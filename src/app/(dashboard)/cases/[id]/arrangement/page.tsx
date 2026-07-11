'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, ClipboardList } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getArrangementConference,
  upsertArrangementConference,
} from '@/lib/api/arrangement-conference';
import { formatDate } from '@/lib/utils/format-date';

const schema = z.object({
  conductedBy: z.string().optional(),
  heldAt: z.string().optional(),
  familyPresentNames: z.string().optional(),
  serviceTypeSelected: z.string().optional(),
  merchandiseSelected: z.string().optional(),
  totalEstimate: z.coerce.number().nonnegative().optional(),
  contractSigned: z.boolean().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function ArrangementConferencePanel({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: conference, isLoading } = useQuery({
    queryKey: ['arrangement-conference', caseId],
    queryFn: () => getArrangementConference(caseId),
  });

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    values: {
      conductedBy: conference?.conductedBy ?? '',
      heldAt: conference?.heldAt ? conference.heldAt.slice(0, 16) : '',
      familyPresentNames: conference?.familyPresentNames ?? '',
      serviceTypeSelected: conference?.serviceTypeSelected ?? '',
      merchandiseSelected: conference?.merchandiseSelected ?? '',
      totalEstimate: conference?.totalEstimate ?? undefined,
      contractSigned: conference?.contractSigned ?? false,
      followUpRequired: conference?.followUpRequired ?? false,
      followUpNotes: conference?.followUpNotes ?? '',
      notes: conference?.notes ?? '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => upsertArrangementConference(caseId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrangement-conference', caseId] });
      toast.success('Arrangement conference saved.');
      setEditing(false);
    },
    onError: () => toast.error('Failed to save arrangement conference.'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!conference && !editing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">No arrangement conference recorded</p>
            <p className="text-xs text-muted-foreground mt-1">
              Document the details from your arrangement meeting with the family.
            </p>
          </div>
          <Button onClick={() => setEditing(true)}>Start Arrangement Conference</Button>
        </CardContent>
      </Card>
    );
  }

  if (!editing && conference) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Arrangement Conference</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {conference.conductedBy && (
              <div>
                <p className="text-xs text-muted-foreground">Conducted By</p>
                <p>{conference.conductedBy}</p>
              </div>
            )}
            {conference.heldAt && (
              <div>
                <p className="text-xs text-muted-foreground">Date &amp; Time</p>
                <p>{formatDate(conference.heldAt)}</p>
              </div>
            )}
            {conference.familyPresentNames && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Family Present</p>
                <p>{conference.familyPresentNames}</p>
              </div>
            )}
            {conference.serviceTypeSelected && (
              <div>
                <p className="text-xs text-muted-foreground">Service Selected</p>
                <p>{conference.serviceTypeSelected}</p>
              </div>
            )}
            {conference.merchandiseSelected && (
              <div>
                <p className="text-xs text-muted-foreground">Merchandise Selected</p>
                <p>{conference.merchandiseSelected}</p>
              </div>
            )}
            {conference.totalEstimate != null && (
              <div>
                <p className="text-xs text-muted-foreground">Total Estimate</p>
                <p className="font-medium">${Number(conference.totalEstimate).toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Contract Signed</p>
              <p>{conference.contractSigned ? `Yes${conference.signedAt ? ` — ${formatDate(conference.signedAt)}` : ''}` : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Follow-up Required</p>
              <p>{conference.followUpRequired ? 'Yes' : 'No'}</p>
            </div>
            {conference.followUpNotes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Follow-up Notes</p>
                <p className="whitespace-pre-wrap">{conference.followUpNotes}</p>
              </div>
            )}
            {conference.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{conference.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {conference ? 'Edit Arrangement Conference' : 'New Arrangement Conference'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conductedBy">Conducted By</Label>
              <Input
                id="conductedBy"
                placeholder="Director name"
                {...form.register('conductedBy')}
              />
            </div>
            <div>
              <Label htmlFor="heldAt">Date &amp; Time</Label>
              <Input id="heldAt" type="datetime-local" {...form.register('heldAt')} />
            </div>
          </div>

          <div>
            <Label htmlFor="familyPresentNames">Family Present</Label>
            <Input
              id="familyPresentNames"
              placeholder="e.g. Jane Smith, Robert Smith"
              {...form.register('familyPresentNames')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceTypeSelected">Service Type Selected</Label>
              <Input
                id="serviceTypeSelected"
                placeholder="e.g. Full service burial"
                {...form.register('serviceTypeSelected')}
              />
            </div>
            <div>
              <Label htmlFor="merchandiseSelected">Merchandise Selected</Label>
              <Input
                id="merchandiseSelected"
                placeholder="e.g. Oak casket #A14"
                {...form.register('merchandiseSelected')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalEstimate">Total Estimate ($)</Label>
            <Input
              id="totalEstimate"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('totalEstimate')}
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...form.register('contractSigned')} className="h-4 w-4" />
              Contract Signed
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                {...form.register('followUpRequired')}
                className="h-4 w-4"
              />
              Follow-up Required
            </label>
          </div>

          <div>
            <Label htmlFor="followUpNotes">Follow-up Notes</Label>
            <Textarea
              id="followUpNotes"
              rows={2}
              placeholder="What needs to be followed up on?"
              {...form.register('followUpNotes')}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional notes from the conference..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            {conference && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CaseArrangementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <ArrangementConferencePanel caseId={id} />
    </div>
  );
}
