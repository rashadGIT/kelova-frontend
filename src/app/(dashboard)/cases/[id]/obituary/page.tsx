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
} from '@/lib/api/obituary-publishing';
import {
  requestContributions,
  listContributions,
  resendContribution,
  type ContributionRecord,
} from '@/lib/api/obituary-contributions';
import type { IObituarySubmission } from '@/types';
import { ExternalLink, Send, CheckCircle2, Clock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
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

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function ObituaryEditor({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: obituary, isLoading: obituaryLoading } = useQuery({
    queryKey: ['obituary', caseId],
    queryFn: () =>
      apiClient.get(`/cases/${caseId}/obituary`).then((r) => r.data).catch((e) => {
        if (e?.response?.status === 404) return null;
        throw e;
      }),
  });

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
  });

  const [draft, setDraft] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => { if (obituary?.draftText) setDraft(obituary.draftText); }, [obituary]);

  const saveMutation = useMutation({
    mutationFn: (text: string) =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: text }),
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
    mutationFn: () =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: draft, status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Obituary approved.');
    },
  });

  const reviseMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: draft, status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Returned to draft.');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/cases/${caseId}/obituary/generate`).then((r) => r.data),
    onSuccess: (data) => {
      setDraft(data.draftText ?? '');
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Draft generated.');
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(draft).then(() => toast.success('Copied to clipboard'));
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
        <CardContent>
          <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
            {obituary.draftText}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Draft two-column editor
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor column */}
      <div className="space-y-3">
        <Textarea
          rows={16}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Click Generate to create a draft from case data, or type directly..."
          className="text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {wordCount(draft)} {wordCount(draft) === 1 ? 'word' : 'words'}
          </p>
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
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            {generateMutation.isPending ? 'Generating…' : 'Generate'}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(draft)}
            disabled={saveMutation.isPending || !draft}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || !draft}
          >
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!draft}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </Button>
        </div>
      </div>

      {/* Preview column */}
      <Card className="lg:sticky lg:top-6 self-start">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draft ? (
            <div>
              {deceasedName && (
                <h3 className="text-base font-semibold mb-3">{deceasedName}</h3>
              )}
              <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">{draft}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Your obituary draft will appear here as you type.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SUB_STATUS_COLORS: Record<IObituarySubmission['status'], string> = {
  submitted: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

function PublishingTab({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [outlet, setOutlet] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
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
        notes: submitNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary-submissions', caseId] });
      toast.success('Submitted to outlet.');
      setSubmitOpen(false);
      setOutlet(''); setContactName(''); setContactEmail(''); setSubmitNotes('');
    },
    onError: () => toast.error('Failed to submit.'),
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
            No obituary found. Write and save a draft on the Obituary tab first.
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
          Approve the obituary on the Obituary tab before submitting to outlets.
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

function ContributionsTab({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: contributions = [], isLoading } = useQuery<ContributionRecord[]>({
    queryKey: ['obituary-contributions', caseId],
    queryFn: () => listContributions(caseId),
  });

  const requestMutation = useMutation({
    mutationFn: () => requestContributions(caseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obituary-contributions', caseId] });
      toast.success(`Contribution requests sent to ${data.sent} family member${data.sent !== 1 ? 's' : ''}.`);
    },
    onError: () => toast.error('Failed to send requests.'),
  });

  const resendMutation = useMutation({
    mutationFn: (contactId: string) => resendContribution(caseId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary-contributions', caseId] });
      toast.success('Contribution request resent.');
    },
    onError: () => toast.error('Failed to resend.'),
  });

  const submitted = contributions.filter((c) => c.submittedAt);
  const pending = contributions.filter((c) => !c.submittedAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {submitted.length} of {contributions.length} submitted
        </p>
        <button
          onClick={() => requestMutation.mutate()}
          disabled={requestMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          {requestMutation.isPending ? 'Sending…' : 'Request Contributions'}
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : contributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No requests sent yet. Click &quot;Request Contributions&quot; to email family members.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...submitted, ...pending].map((c) => (
            <Card key={c.id}>
              <CardContent className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {c.submittedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{c.familyContact.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {c.familyContact.relationship}
                        </span>
                      </div>
                      {c.familyContact.email && (
                        <button
                          onClick={() => resendMutation.mutate(c.familyContactId)}
                          disabled={resendMutation.isPending}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {resendMutation.isPending ? 'Sending…' : 'Resend'}
                        </button>
                      )}
                    </div>
                    {c.familyContact.email && (
                      <p className="text-xs text-muted-foreground">{c.familyContact.email}</p>
                    )}
                    {c.contributionText && (
                      <p className="mt-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-muted pl-3">
                        {c.contributionText}
                      </p>
                    )}
                    {!c.submittedAt && (
                      <p className="mt-1 text-xs text-muted-foreground italic">Awaiting response</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const OBT_TABS = ['Obituary', 'Contributions', 'Publishing'] as const;
type ObtTab = (typeof OBT_TABS)[number];

export default function CaseObituaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<ObtTab>('Obituary');

  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="flex border-b mb-6">
        {OBT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Obituary' && <ObituaryEditor caseId={id} />}
      {activeTab === 'Contributions' && <ContributionsTab caseId={id} />}
      {activeTab === 'Publishing' && <PublishingTab caseId={id} />}
    </div>
  );
}
