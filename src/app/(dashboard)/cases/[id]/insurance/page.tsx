'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getInsurance,
  getInsuranceFollowUps,
  addInsuranceFollowUp,
  type CreateFollowUpDto,
} from '@/lib/api/case-extras';

const STATUSES = ['pending', 'submitted', 'approved', 'funded'] as const;
type InsuranceStatus = typeof STATUSES[number];

const METHOD_LABELS = { call: 'Phone', email: 'Email', portal: 'Portal' } as const;
const METHOD_ICONS = { call: '📞', email: '✉️', portal: '🌐' } as const;

function statusColor(s: InsuranceStatus, current: InsuranceStatus) {
  const idx = STATUSES.indexOf(s);
  const curIdx = STATUSES.indexOf(current);
  if (idx < curIdx) return 'bg-green-500';
  if (idx === curIdx) return 'bg-primary';
  return 'bg-muted';
}

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function InsurancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDto, setFollowUpDto] = useState<CreateFollowUpDto>({ method: 'call' });

  const { data: insurance, isLoading } = useQuery({
    queryKey: ['insurance', id],
    queryFn: () => getInsurance(id),
  });

  const { data: followUps = [], isLoading: followUpsLoading } = useQuery({
    queryKey: ['insurance-follow-ups', insurance?.id],
    queryFn: () => getInsuranceFollowUps(insurance!.id),
    enabled: !!insurance?.id,
  });

  const addFollowUp = useMutation({
    mutationFn: (dto: CreateFollowUpDto) => addInsuranceFollowUp(insurance!.id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-follow-ups', insurance?.id] });
      setShowFollowUpForm(false);
      setFollowUpDto({ method: 'call' });
      toast.success('Follow-up logged.');
    },
    onError: () => toast.error('Failed to log follow-up.'),
  });

  const isStale =
    insurance?.status === 'submitted' &&
    insurance.submittedAt &&
    daysSince(insurance.submittedAt) > 7;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Assignment"
        action={<Button variant="outline">Lookup Policy</Button>}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {/* Stale claim warning */}
          {isStale && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <span className="mt-0.5 text-amber-500">⚠</span>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Claim submitted {daysSince(insurance!.submittedAt!)} days ago — no response yet
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Consider calling {insurance?.insuranceCompany} or logging a follow-up below.
                </p>
              </div>
            </div>
          )}

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Claim Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {STATUSES.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-3 w-3 rounded-full ${statusColor(s, insurance?.status ?? 'pending')}`}
                      />
                      <span className="text-xs capitalize text-muted-foreground">{s}</span>
                    </div>
                    {i < STATUSES.length - 1 && (
                      <div className="flex-1 h-px bg-muted mx-1 mb-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Policy Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Policy Details</CardTitle>
                {insurance?.status && (
                  <Badge variant="outline" className="capitalize">{insurance.status}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Insured Name</label>
                <Input defaultValue={insurance?.insuredName ?? ''} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Insurance Company</label>
                <Input defaultValue={insurance?.insuranceCompany ?? ''} placeholder="Company name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Policy Number</label>
                <Input defaultValue={insurance?.policyNumber ?? ''} placeholder="Policy #" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Face Value</label>
                <Input type="number" defaultValue={insurance?.faceValue ?? ''} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Claimant Name</label>
                <Input defaultValue={insurance?.claimantName ?? ''} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Relationship to Deceased</label>
                <Input defaultValue={insurance?.relationship ?? ''} placeholder="Spouse, child..." />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <Button>Save Changes</Button>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <select className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {insurance && (
            <div className="text-sm text-muted-foreground">
              Estimated payout: <span className="font-medium text-foreground">{usd(insurance.faceValue)}</span>
            </div>
          )}

          {/* Follow-Up Log */}
          {insurance && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Follow-Up Log</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFollowUpForm((v) => !v)}
                  >
                    {showFollowUpForm ? 'Cancel' : 'Log Follow-Up'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Inline log form */}
                {showFollowUpForm && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Method</label>
                        <select
                          value={followUpDto.method}
                          onChange={(e) =>
                            setFollowUpDto((d) => ({ ...d, method: e.target.value as CreateFollowUpDto['method'] }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="call">Phone Call</option>
                          <option value="email">Email</option>
                          <option value="portal">Carrier Portal</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Follow-Up</label>
                        <Input
                          type="date"
                          value={followUpDto.nextFollowUpDate ?? ''}
                          onChange={(e) =>
                            setFollowUpDto((d) => ({ ...d, nextFollowUpDate: e.target.value || undefined }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
                      <Input
                        placeholder="What happened on this follow-up?"
                        value={followUpDto.notes ?? ''}
                        onChange={(e) =>
                          setFollowUpDto((d) => ({ ...d, notes: e.target.value || undefined }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={addFollowUp.isPending}
                      onClick={() => addFollowUp.mutate(followUpDto)}
                    >
                      {addFollowUp.isPending ? 'Saving…' : 'Save Follow-Up'}
                    </Button>
                  </div>
                )}

                {/* Timeline */}
                {followUpsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : followUps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No follow-ups logged yet.
                  </p>
                ) : (
                  <ol className="relative border-l border-border ml-3 space-y-4">
                    {followUps.map((fu) => (
                      <li key={fu.id} className="ml-4">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground/40" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {METHOD_ICONS[fu.method]} {METHOD_LABELS[fu.method]}
                              {fu.createdBy && (
                                <span className="text-muted-foreground font-normal"> · {fu.createdBy.name}</span>
                              )}
                            </p>
                            {fu.notes && (
                              <p className="text-sm text-muted-foreground mt-0.5">{fu.notes}</p>
                            )}
                            {fu.nextFollowUpDate && (
                              <p className="text-xs text-amber-700 mt-0.5">
                                Next: {fmtDate(fu.nextFollowUpDate)}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(fu.createdAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
