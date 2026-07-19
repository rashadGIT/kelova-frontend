'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  getSubmissionsByCase,
  submitObituary,
  confirmPublished,
  updateSubmissionStatus,
  emailToOutlet,
} from '@/lib/api/obituary-publishing';
import {
  getObituary,
  generateObituary,
  updateObituary,
  listRevisions,
  restoreRevision,
  shareObituaryWithFamily,
  type ObituaryTone,
  type ObituaryLength,
  type IObituaryRevision,
} from '@/lib/api/obituary';
import type { IObituarySubmission, ObituaryBlock } from '@/types';
import { ExternalLink, Send, History, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/dashboard/ui/button';
import { AutoGrowTextarea } from '@/components/ui/autogrow-textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { apiClient } from '@/lib/api/client';
import { AxiosError } from 'axios';
import { Copy, Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatRelative } from '@/lib/utils/format-date';
import { BlockEditor } from '@/components/obituary/block-editor';
import { BlockPreview } from '@/components/obituary/block-preview';
import {
  wordCountForBlocks,
  wordCountGuidance,
  serializeBlocksToPlainText,
  summarizeBlocks,
} from '@/components/obituary/obituary-content.util';

const REVISION_SOURCE_LABELS: Record<IObituaryRevision['source'], string> = {
  ai_generated: 'AI generated',
  manual_edit: 'Manual edit',
  restored: 'Restored',
};

function RevisionHistoryDialog({
  caseId,
  open,
  onOpenChange,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ['obituary-revisions', caseId],
    queryFn: () => listRevisions(caseId),
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: (revisionId: string) => restoreRevision(caseId, revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      queryClient.invalidateQueries({ queryKey: ['obituary-revisions', caseId] });
      toast.success('Restored.');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to restore revision.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Revision History</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revisions yet.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {revisions.map((rev) => (
              <div key={rev.id} className="text-sm border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <p>
                    <span className="font-medium">{REVISION_SOURCE_LABELS[rev.source]}</span>{' '}
                    <span className="text-xs text-muted-foreground">· {rev.status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelative(rev.createdAt)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                  {expandedId === rev.id
                    ? serializeBlocksToPlainText(rev.content.blocks)
                    : summarizeBlocks(rev.content.blocks)}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() => setExpandedId(expandedId === rev.id ? null : rev.id)}
                  >
                    {expandedId === rev.id ? 'Collapse' : 'View'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => restoreMutation.mutate(rev.id)}
                    disabled={restoreMutation.isPending}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ObituaryEditor({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: obituary, isLoading: obituaryLoading } = useQuery({
    queryKey: ['obituary', caseId],
    queryFn: () => getObituary(caseId),
  });

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
  });

  const [blocks, setBlocks] = useState<ObituaryBlock[]>([]);
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [tone, setTone] = useState<ObituaryTone>('warm');
  const [length, setLength] = useState<ObituaryLength>('traditional');
  const [personalDetails, setPersonalDetails] = useState('');
  const [personalDetailsSaved, setPersonalDetailsSaved] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (obituary?.content?.blocks) setBlocks(obituary.content.blocks);
  }, [obituary]);
  useEffect(() => {
    setPersonalDetails(caseData?.personalDetails ?? '');
  }, [caseData]);

  const savePersonalDetailsMutation = useMutation({
    mutationFn: (text: string) =>
      apiClient.patch(`/cases/${caseId}`, { personalDetails: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setPersonalDetailsSaved(true);
      setTimeout(() => setPersonalDetailsSaved(false), 2000);
    },
    onError: () => toast.error('Failed to save personal details.'),
  });

  const saveMutation = useMutation({
    mutationFn: (blocksToSave: ObituaryBlock[]) =>
      updateObituary(caseId, { content: { blocks: blocksToSave } }),
    onMutate: () => setSaveIndicator('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Obituary saved.');
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator('idle'), 2000);
    },
    onError: () => setSaveIndicator('idle'),
  });

  const approveMutation = useMutation({
    mutationFn: () => updateObituary(caseId, { content: { blocks }, status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Obituary approved.');
    },
  });

  const reviseMutation = useMutation({
    mutationFn: () => updateObituary(caseId, { content: { blocks }, status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Returned to draft.');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateObituary(caseId, { tone, length }),
    onSuccess: (data) => {
      setBlocks(data.content?.blocks ?? []);
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      setGenerateOpen(false);
      toast.success('Draft generated.');
    },
    onError: () => toast.error('Failed to generate draft.'),
  });

  const shareMutation = useMutation({
    mutationFn: () => shareObituaryWithFamily(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Shared with family.');
    },
    onError: (e: unknown) => {
      const message =
        e instanceof AxiosError ? (e.response?.data?.message as string | undefined) : undefined;
      toast.error(message ?? 'Failed to share with family.');
    },
  });

  const handleCopy = () => {
    navigator.clipboard
      .writeText(serializeBlocksToPlainText(blocks))
      .then(() => toast.success('Copied to clipboard'));
  };

  const deceasedName = caseData?.deceasedName ?? '';

  if (obituaryLoading) return <Skeleton className="h-64 w-full" />;

  // Approved read-only view
  if (obituary?.status === 'approved') {
    return (
      <Card className="max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <StatusPill kind="completed" />
            {deceasedName && (
              <h2 className="text-xl font-semibold tracking-tight">{deceasedName}</h2>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="h-3.5 w-3.5 mr-1.5" />
              History
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareMutation.mutate()}
              disabled={shareMutation.isPending}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              {shareMutation.isPending ? 'Sharing…' : 'Share for Review'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => reviseMutation.mutate()}
              disabled={reviseMutation.isPending}
            >
              Revise
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <BlockPreview caseId={caseId} blocks={blocks} />
          {obituary.sharedWithFamilyAt && (
            <p className="text-xs text-muted-foreground">
              Shared with family on {formatRelative(obituary.sharedWithFamilyAt)}
            </p>
          )}
        </CardContent>
        <RevisionHistoryDialog caseId={caseId} open={historyOpen} onOpenChange={setHistoryOpen} />
      </Card>
    );
  }

  // Draft two-column editor
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor column */}
      <div className="space-y-3">
        <div className="space-y-1.5 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="personal-details" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Personal Details (used in AI drafts)
            </Label>
            {personalDetailsSaved && <p className="text-xs text-green-600">Saved ✓</p>}
          </div>
          <AutoGrowTextarea
            id="personal-details"
            value={personalDetails}
            onChange={(e) => setPersonalDetails(e.target.value)}
            onBlur={() => {
              if (personalDetails !== (caseData?.personalDetails ?? '')) {
                savePersonalDetailsMutation.mutate(personalDetails);
              }
            }}
            placeholder="Hobbies, interests, or color the family shared — e.g. loved fishing, sang in the church choir"
            className="text-sm"
          />
        </div>
        <BlockEditor caseId={caseId} blocks={blocks} onChange={setBlocks} />
        <div className="flex items-center justify-between">
          {(() => {
            const guidance = wordCountGuidance(wordCountForBlocks(blocks));
            return (
              <p className={cn('text-xs', guidance.tone === 'warning' ? 'text-amber-600' : 'text-muted-foreground')}>
                {guidance.text}
              </p>
            );
          })()}
          {saveIndicator === 'saving' && (
            <p className="text-xs text-muted-foreground">Saving...</p>
          )}
          {saveIndicator === 'saved' && (
            <p className="text-xs text-green-600">Saved ✓</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            disabled={generateMutation.isPending}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            {generateMutation.isPending ? 'Generating…' : 'Generate'}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(blocks)}
            disabled={saveMutation.isPending || blocks.length === 0}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="h-3.5 w-3.5 mr-1.5" />
            History
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || blocks.length === 0}
          >
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} disabled={blocks.length === 0}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending || blocks.length === 0}
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {shareMutation.isPending ? 'Sharing…' : 'Share for Review'}
          </Button>
        </div>
        {obituary?.sharedWithFamilyAt && (
          <p className="text-xs text-muted-foreground">
            Shared with family on {formatRelative(obituary.sharedWithFamilyAt)}
          </p>
        )}
      </div>

      {/* Preview column */}
      <Card className="lg:sticky lg:top-6 self-start">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deceasedName && blocks.length > 0 && (
            <h3 className="text-base font-semibold mb-3">{deceasedName}</h3>
          )}
          <BlockPreview caseId={caseId} blocks={blocks} />
        </CardContent>
      </Card>

      {/* Generate options dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Obituary Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="gen-tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as ObituaryTone)}>
                <SelectTrigger id="gen-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gen-length">Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as ObituaryLength)}>
                <SelectTrigger id="gen-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {personalDetails && (
              <p className="text-xs text-muted-foreground">
                Personal details on file will be included: &quot;{personalDetails}&quot;
              </p>
            )}
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RevisionHistoryDialog caseId={caseId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}

const SUB_STATUS_COLORS: Record<IObituarySubmission['status'], string> = {
  submitted: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

function PublishingSection({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [outlet, setOutlet] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [outletEmail, setOutletEmail] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');

  const { data: obituary } = useQuery({
    queryKey: ['obituary', caseId],
    queryFn: () =>
      apiClient.get(`/cases/${caseId}/obituary`).then((r) => r.data).catch((e) => {
        if (e?.response?.status === 404) return null;
        throw e;
      }),
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['obituary-submissions', caseId],
    queryFn: () => getSubmissionsByCase(caseId),
    enabled: !!obituary,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitObituary(obituary.id, {
        outlet,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        outletEmail: outletEmail || undefined,
        notes: submitNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary-submissions', caseId] });
      toast.success('Submitted to outlet.');
      setSubmitOpen(false);
      setOutlet(''); setContactName(''); setContactEmail(''); setOutletEmail(''); setSubmitNotes('');
    },
    onError: () => toast.error('Failed to submit.'),
  });

  const emailMutation = useMutation({
    mutationFn: (submissionId: string) => emailToOutlet(submissionId),
    onSuccess: (result) => {
      toast.success(`Draft emailed to ${result.to}.`);
    },
    onError: (e: unknown) => {
      const message =
        e instanceof AxiosError ? (e.response?.data?.message as string | undefined) : undefined;
      toast.error(message ?? 'Failed to email outlet.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      confirmPublished(confirmId!, { publishedUrl: publishedUrl || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary-submissions', caseId] });
      toast.success('Marked as published.');
      setConfirmId(null);
      setPublishedUrl('');
    },
    onError: () => toast.error('Failed to confirm.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IObituarySubmission['status'] }) =>
      updateSubmissionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary-submissions', caseId] });
      toast.success('Status updated.');
    },
  });

  if (!obituary) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No obituary found. Write and save a draft above first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setSubmitOpen(true)} disabled={obituary?.status !== 'approved'}>
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Submit to Outlet
        </Button>
      </div>

      {obituary?.status !== 'approved' && (
        <p className="text-xs text-amber-600">
          Approve the obituary above before submitting to outlets.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex items-start justify-between px-4 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{sub.outlet}</p>
                  {sub.contactName && (
                    <p className="text-xs text-muted-foreground">{sub.contactName}</p>
                  )}
                  {sub.publishedUrl && (
                    <a
                      href={sub.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View published
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS_COLORS[sub.status]}`}
                  >
                    {sub.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => emailMutation.mutate(sub.id)}
                    disabled={!sub.outletEmail || emailMutation.isPending}
                    title={sub.outletEmail ? undefined : 'No outlet email on file'}
                  >
                    {emailMutation.isPending && emailMutation.variables === sub.id
                      ? 'Emailing…'
                      : 'Email Draft'}
                  </Button>
                  {sub.status === 'submitted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmId(sub.id)}
                    >
                      Confirm Published
                    </Button>
                  )}
                  {(sub.status === 'submitted' || sub.status === 'published') && (
                    <Select
                      onValueChange={(v) =>
                        statusMutation.mutate({ id: sub.id, status: v as IObituarySubmission['status'] })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-24">
                        <SelectValue placeholder="Update..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit to Outlet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pub-outlet">Outlet Name</Label>
              <Input
                id="pub-outlet"
                placeholder="e.g. Columbus Dispatch"
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pub-contact">Contact Name</Label>
              <Input
                id="pub-contact"
                placeholder="Optional"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pub-email">Contact Email</Label>
              <Input
                id="pub-email"
                type="email"
                placeholder="Optional"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pub-outlet-email">Outlet Email (for Email Draft)</Label>
              <Input
                id="pub-outlet-email"
                type="email"
                placeholder="e.g. obits@dispatch.com"
                value={outletEmail}
                onChange={(e) => setOutletEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pub-notes">Notes</Label>
              <Input
                id="pub-notes"
                placeholder="Optional"
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!outlet || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm published dialog */}
      <Dialog open={!!confirmId} onOpenChange={(v) => { if (!v) { setConfirmId(null); setPublishedUrl(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Published</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pub-url">Published URL</Label>
              <Input
                id="pub-url"
                type="url"
                placeholder="https://..."
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="w-full"
            >
              {confirmMutation.isPending ? 'Saving...' : 'Mark as Published'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CaseObituaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="space-y-10">
        <ObituaryEditor caseId={id} />
        <div>
          <h2 className="text-lg font-semibold tracking-tight mb-4">Publishing</h2>
          <PublishingSection caseId={id} />
        </div>
      </div>
    </div>
  );
}
