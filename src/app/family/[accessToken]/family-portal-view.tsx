'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  User,
  CalendarDays,
  MessageSquare,
  CreditCard,
  PenLine,
  Info,
  Play,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { publicApiClient } from '@/lib/api/public-client';
import type { PortalData } from './page';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  first_call: 'First Call',
  arrangement_scheduled: 'Arrangement Scheduled',
  arrangement_complete: 'Arrangements Complete',
  in_preparation: 'In Preparation',
  services_scheduled: 'Services Scheduled',
  services_complete: 'Services Complete',
  death_cert_filed: 'Death Certificate Filed',
  closed: 'Closed',
};
const STAGE_ORDER = Object.keys(STAGE_LABELS);

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  in_progress: 'default',
  completed: 'default',
  archived: 'outline',
};

const DOC_SLOTS = [
  { label: 'Insurance Policy', type: 'insurance_policy', hint: 'Upload a copy of the policy document' },
  { label: 'Government-Issued ID', type: 'identification', hint: "Driver's license, passport, or state ID" },
  { label: 'Military Records', type: 'other', hint: 'DD-214 or service records', veteranOnly: true },
  { label: 'Birth Certificate', type: 'other', hint: 'Official birth certificate' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StageTimeline({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                isDone ? 'bg-primary border-primary'
                  : isCurrent ? 'bg-primary/20 border-primary'
                  : 'bg-muted border-muted-foreground/30'
              }`} />
              {i < STAGE_ORDER.length - 1 && (
                <div className={`w-0.5 h-5 ${isDone ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
            <span className={`text-sm pb-4 ${
              isCurrent ? 'font-semibold text-primary'
                : isDone ? 'text-muted-foreground line-through'
                : 'text-muted-foreground'
            }`}>
              {STAGE_LABELS[stage] ?? stage}
              {isCurrent && <span className="ml-2 text-xs font-normal">(current)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DocumentRow({ doc }: { doc: { id: string; fileName: string; documentType: string; uploaded: boolean } }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.fileName}</p>
        <p className="text-xs text-muted-foreground capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
      </div>
      {doc.uploaded
        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
    </div>
  );
}

function SlotUploadButton({
  accessToken,
  documentType,
  label,
  onUploaded,
}: {
  accessToken: string;
  documentType: string;
  label: string;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { data } = await publicApiClient.post<{ uploadUrl: string; documentId: string }>(
        `/family-portal/${accessToken}/documents`,
        { fileName: file.name, contentType: file.type || 'application/octet-stream', documentType },
      );
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      toast.success(`${label} uploaded`);
      onUploaded();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="gap-1.5 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FamilyPortalView({
  data,
  accessToken,
}: {
  data: PortalData;
  accessToken: string;
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') ?? 'status';
  const paymentSuccess = searchParams.get('payment') === 'success';

  const [docs, setDocs] = useState(data.documents);
  const [activeTab, setActiveTab] = useState(initialTab);
  const caseData = data.case!;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const rsvpTask = data.tasks.find((t) => t.rsvpToken && !t.completed);

  async function refreshDocs() {
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}`);
      if (res.ok) {
        const refreshed = (await res.json()) as typeof data;
        setDocs(refreshed.documents);
      }
    } catch { /* silent */ }
  }

  const primaryContact = data.contacts.find((c) => c.isPrimaryContact);
  const serviceLabel = caseData.serviceType.charAt(0).toUpperCase() + caseData.serviceType.slice(1);

  // ── Info Form ──────────────────────────────────────────────────────────

  const [infoLoaded, setInfoLoaded] = useState(false);
  const [infoSubmitting, setInfoSubmitting] = useState(false);
  const [infoSubmittedAt, setInfoSubmittedAt] = useState<string | null>(caseData.familyInfoSubmittedAt);
  const [infoForm, setInfoForm] = useState<Record<string, string | boolean>>({});

  const loadInfoForm = useCallback(async () => {
    if (infoLoaded) return;
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/info-form`);
      if (res.ok) {
        const d = (await res.json()) as Record<string, unknown>;
        const flat: Record<string, string | boolean> = {};
        for (const [k, v] of Object.entries(d)) {
          if (v !== null && v !== undefined && k !== 'insurance' && k !== 'pallbearers') {
            flat[k] = typeof v === 'boolean' ? v : String(v);
          }
        }
        if (d['insurance']) {
          const ins = d['insurance'] as Record<string, unknown>;
          for (const [k, v] of Object.entries(ins)) {
            if (v !== null && v !== undefined) flat[`insurance.${k}`] = String(v);
          }
        }
        setInfoForm(flat);
        if (d['familyInfoSubmittedAt']) {
          setInfoSubmittedAt(String(d['familyInfoSubmittedAt']));
        }
      }
    } finally {
      setInfoLoaded(true);
    }
  }, [infoLoaded, accessToken, apiUrl]);

  useEffect(() => {
    if (activeTab === 'info') void loadInfoForm();
  }, [activeTab, loadInfoForm]);

  function infoField(key: string) {
    return (infoForm[key] as string) ?? '';
  }

  function setField(key: string, value: string | boolean) {
    setInfoForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitInfoForm() {
    setInfoSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(infoForm)) {
        if (k.startsWith('insurance.')) continue;
        if (v !== '') body[k] = v;
      }
      const ins: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(infoForm)) {
        if (!k.startsWith('insurance.')) continue;
        const field = k.replace('insurance.', '');
        if (v !== '') ins[field] = v;
      }
      if (Object.keys(ins).length > 0) body['insurance'] = ins;

      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/info-form`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      setInfoSubmittedAt(new Date().toISOString());
      toast.success('Information submitted successfully');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setInfoSubmitting(false);
    }
  }

  // ── Payment ────────────────────────────────────────────────────────────

  const [paymentData, setPaymentData] = useState<{
    payment: { totalAmount: number; amountPaid: number } | null;
    outstanding: number | null;
    paymentPlan: { installments: { installmentNumber: number; amount: number; dueDate: string; paidAt: string | null }[] } | null;
  } | null>(null);
  const [paymentLoaded, setPaymentLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const loadPayment = useCallback(async () => {
    if (paymentLoaded) return;
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/payment`);
      if (res.ok) setPaymentData(await res.json());
    } finally {
      setPaymentLoaded(true);
    }
  }, [paymentLoaded, accessToken, apiUrl]);

  useEffect(() => {
    if (activeTab === 'pay') void loadPayment();
  }, [activeTab, loadPayment]);

  async function startCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/payment/checkout`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      toast.error('Could not start checkout. Please try again.');
      setCheckingOut(false);
    }
  }

  // ── Signatures ─────────────────────────────────────────────────────────

  const [signatures, setSignatures] = useState<{
    id: string; documentType: string; token: string; signedAt: string | null; expiresAt: string; signerName: string | null;
  }[]>([]);
  const [signaturesLoaded, setSignaturesLoaded] = useState(false);

  const loadSignatures = useCallback(async () => {
    if (signaturesLoaded) return;
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/signatures`);
      if (res.ok) setSignatures(await res.json());
    } finally {
      setSignaturesLoaded(true);
    }
  }, [signaturesLoaded, accessToken, apiUrl]);

  useEffect(() => {
    if (activeTab === 'sign') void loadSignatures();
  }, [activeTab, loadSignatures]);

  const pendingSignatures = signatures.filter((s) => !s.signedAt);

  // ── Messages ───────────────────────────────────────────────────────────

  const [messages, setMessages] = useState<{
    id: string; body: string; senderType: string; createdAt: string;
  }[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/messages`);
      if (res.ok) {
        setMessages(await res.json());
        setMessagesLoaded(true);
      }
    } catch { /* silent */ }
  }, [accessToken, apiUrl]);

  useEffect(() => {
    if (activeTab !== 'messages') return;
    void loadMessages();
    const interval = setInterval(() => void loadMessages(), 15000);
    return () => clearInterval(interval);
  }, [activeTab, loadMessages]);

  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newMessage.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setNewMessage('');
      await loadMessages();
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  // ── Grief support ──────────────────────────────────────────────────────

  const [griefData, setGriefData] = useState<{
    unlocked: boolean;
    resources: { id: string; title: string; description: string | null; category: string; videoUrl: string; thumbnailUrl: string | null; durationMin: number | null }[];
  } | null>(null);

  useEffect(() => {
    if (caseData.status !== 'completed') return;
    fetch(`${apiUrl}/family-portal/${accessToken}/grief`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setGriefData(d as typeof griefData); })
      .catch(() => {/* silent */});
  }, [caseData.status, accessToken, apiUrl]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-5 sm:px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Arrangement Status</p>
          <h1 className="text-xl font-semibold">{caseData.deceasedName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={STATUS_VARIANT[caseData.status] ?? 'secondary'} className="capitalize">
              {caseData.status.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">{serviceLabel} Service</span>
          </div>
        </div>
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-2 text-green-800 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Payment received — thank you.
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6 grid grid-cols-4 h-auto">
            <TabsTrigger value="status" className="text-xs py-2">Status</TabsTrigger>
            <TabsTrigger value="info" className="text-xs py-2 relative">
              Info
              {!infoSubmittedAt && (
                <span className="ml-1 inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="pay" className="text-xs py-2">Pay</TabsTrigger>
            <TabsTrigger value="sign" className="text-xs py-2 relative">
              Sign
              {pendingSignatures.length > 0 && signaturesLoaded && (
                <span className="ml-1 inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
          </TabsList>
          <TabsList className="w-full mb-6 grid grid-cols-3 h-auto">
            <TabsTrigger value="documents" className="text-xs py-2">Documents</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs py-2">Messages</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs py-2">Contacts</TabsTrigger>
          </TabsList>

          {/* ── Status tab ── */}
          <TabsContent value="status" className="space-y-5">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Progress</p>
              <StageTimeline currentStage={caseData.stage} />
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Case Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case opened</span>
                  <span>{new Date(caseData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service type</span>
                  <span className="capitalize">{caseData.serviceType}</span>
                </div>
                {caseData.arrangementDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service date</span>
                    <span>{new Date(caseData.arrangementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* RSVP card */}
            {rsvpTask && caseData.arrangementDate && (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Upcoming Service</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(caseData.arrangementDate).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                    {rsvpTask.rsvpStatus !== 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => window.open(`/rsvp/${rsvpTask.rsvpToken}`, '_blank')}
                      >
                        RSVP for Service
                      </Button>
                    )}
                    {rsvpTask.rsvpStatus === 'accepted' && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> You&apos;ve confirmed attendance
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Questions? Contact your funeral home directly.
            </p>
          </TabsContent>

          {/* ── Info tab ── */}
          <TabsContent value="info" className="space-y-4">
            {!infoLoaded ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : infoSubmittedAt ? (
              <Card className="p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Information submitted</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted on {new Date(infoSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                    Contact your funeral home to make changes.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-4 flex items-start gap-3 bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">Please fill in the details below. Once submitted, contact the funeral home to make changes.</p>
              </Card>
            )}

            {/* Section 1: Death Certificate Info */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Death Certificate Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Date of Birth</label>
                  <Input
                    type="date"
                    value={infoField('deceasedDob').split('T')[0]}
                    onChange={(e) => setField('deceasedDob', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">State of Birth</label>
                  <Input
                    value={infoField('birthState')}
                    onChange={(e) => setField('birthState', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="e.g. Ohio"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Marital Status</label>
                  <Input
                    value={infoField('maritalStatus')}
                    onChange={(e) => setField('maritalStatus', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="e.g. Married"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Occupation</label>
                  <Input
                    value={infoField('occupation')}
                    onChange={(e) => setField('occupation', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="Last occupation"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Education</label>
                  <Input
                    value={infoField('education')}
                    onChange={(e) => setField('education', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="Highest level"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Faith / Religion</label>
                  <Input
                    value={infoField('faithTradition')}
                    onChange={(e) => setField('faithTradition', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="e.g. Baptist"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Place of Death</label>
                  <Input
                    value={infoField('placeOfDeath')}
                    onChange={(e) => setField('placeOfDeath', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="Hospital, home, etc."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">State of Death</label>
                  <Input
                    value={infoField('stateOfDeath')}
                    onChange={(e) => setField('stateOfDeath', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="e.g. Ohio"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Cause of Death (if known)</label>
                <Input
                  value={infoField('causeOfDeath')}
                  onChange={(e) => setField('causeOfDeath', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="As known to family"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="veteran"
                  checked={(infoForm['veteranStatus'] as boolean) ?? false}
                  onChange={(e) => setField('veteranStatus', e.target.checked)}
                  disabled={!!infoSubmittedAt}
                  className="h-4 w-4"
                />
                <label htmlFor="veteran" className="text-sm">Veteran</label>
              </div>
            </Card>

            {/* Section 2: Biographical Info */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Biographical Information</p>
              <div className="space-y-1">
                <label className="text-xs font-medium">Survivors (for obituary)</label>
                <Textarea
                  value={infoField('survivors') ?? ''}
                  onChange={(e) => setField('survivors', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="e.g. Survived by spouse Jane, children Michael and Sarah…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Additional notes for obituary</label>
                <Textarea
                  value={infoField('obituaryNotes') ?? ''}
                  onChange={(e) => setField('obituaryNotes', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="Hobbies, memberships, achievements, special memories…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </Card>

            {/* Section 3: Arrangement Preferences */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arrangement Preferences</p>
              <div className="space-y-1">
                <label className="text-xs font-medium">Clothing Description</label>
                <Input
                  value={infoField('clothingDescription')}
                  onChange={(e) => setField('clothingDescription', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="Describe outfit or note if bringing clothes"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Personal Effects / Jewelry</label>
                <Input
                  value={infoField('personalEffects')}
                  onChange={(e) => setField('personalEffects', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="Items to be included or returned"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Pallbearers</label>
                <Textarea
                  value={infoField('pallbearers')}
                  onChange={(e) => setField('pallbearers', e.target.value)}
                  disabled={!!infoSubmittedAt}
                  placeholder="Names of pallbearers, one per line"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Officiant</label>
                  <Input
                    value={infoField('officiantName')}
                    onChange={(e) => setField('officiantName', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="Name of pastor/celebrant"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Music Preferences</label>
                  <Input
                    value={infoField('musicPreferences') ?? ''}
                    onChange={(e) => setField('musicPreferences', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="Songs or hymns"
                    className="text-sm"
                  />
                </div>
              </div>
            </Card>

            {/* Section 4: Insurance */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurance Information</p>
              <p className="text-xs text-muted-foreground">
                If funeral expenses will be paid by life insurance, please provide the policy details below.
                Upload a copy of the policy in the Documents tab.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Insured Name</label>
                  <Input
                    value={infoField('insurance.insuredName')}
                    onChange={(e) => setField('insurance.insuredName', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Insurance Company</label>
                  <Input
                    value={infoField('insurance.insuranceCompany')}
                    onChange={(e) => setField('insurance.insuranceCompany', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Policy Number</label>
                  <Input
                    value={infoField('insurance.policyNumber')}
                    onChange={(e) => setField('insurance.policyNumber', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Face Value ($)</label>
                  <Input
                    type="number"
                    value={infoField('insurance.faceValue')}
                    onChange={(e) => setField('insurance.faceValue', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Claimant Name</label>
                  <Input
                    value={infoField('insurance.claimantName')}
                    onChange={(e) => setField('insurance.claimantName', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Claimant Relationship</label>
                  <Input
                    value={infoField('insurance.claimantRelationship')}
                    onChange={(e) => setField('insurance.claimantRelationship', e.target.value)}
                    disabled={!!infoSubmittedAt}
                    placeholder="e.g. Spouse"
                    className="text-sm"
                  />
                </div>
              </div>
            </Card>

            {!infoSubmittedAt && (
              <Button
                className="w-full"
                onClick={() => void submitInfoForm()}
                disabled={infoSubmitting}
              >
                {infoSubmitting ? 'Submitting…' : 'Save & Submit Information'}
              </Button>
            )}
          </TabsContent>

          {/* ── Pay tab ── */}
          <TabsContent value="pay" className="space-y-4">
            {paymentSuccess && (
              <Card className="p-4 flex items-start gap-3 bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Payment confirmed</p>
                  <p className="text-xs text-green-700 mt-0.5">Your payment has been received. Thank you.</p>
                </div>
              </Card>
            )}

            {!paymentLoaded ? (
              <Skeleton className="h-32 w-full" />
            ) : !paymentData?.payment ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No payment record on file yet.</p>
                <p className="text-xs mt-1">Contact your funeral home for payment details.</p>
              </Card>
            ) : (
              <>
                <Card className="p-4 space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span>${Number(paymentData.payment.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="text-green-600">${Number(paymentData.payment.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Balance Due</span>
                      <span>${Number(paymentData.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {(paymentData.outstanding ?? 0) > 0 && (
                    <Button
                      className="w-full"
                      onClick={() => void startCheckout()}
                      disabled={checkingOut}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {checkingOut ? 'Redirecting…' : `Pay $${Number(paymentData.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })} Now`}
                    </Button>
                  )}
                  {(paymentData.outstanding ?? 0) <= 0 && (
                    <p className="text-sm text-center text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Paid in full — thank you.
                    </p>
                  )}
                </Card>

                {paymentData.paymentPlan && (
                  <Card className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Plan</p>
                    {paymentData.paymentPlan.installments.map((inst) => (
                      <div key={inst.installmentNumber} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <span className="text-muted-foreground">Installment #{inst.installmentNumber}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(inst.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span>${Number(inst.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        {inst.paidAt
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <Clock className="h-4 w-4 text-amber-500" />}
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Payments are processed securely via Stripe. Your card details are never stored.
            </p>
          </TabsContent>

          {/* ── Sign tab ── */}
          <TabsContent value="sign" className="space-y-4">
            {!signaturesLoaded ? (
              <Skeleton className="h-24 w-full" />
            ) : signatures.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">
                <PenLine className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No signature requests on file.</p>
              </Card>
            ) : (
              <Card className="p-4 divide-y">
                {signatures.map((sig) => (
                  <div key={sig.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {sig.documentType.replace(/_/g, ' ')}
                      </p>
                      {sig.signedAt ? (
                        <p className="text-xs text-green-600 mt-0.5">
                          Signed {new Date(sig.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-0.5">Awaiting signature</p>
                      )}
                    </div>
                    {sig.signedAt ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => { window.location.href = `/sign/${sig.token}`; }}
                      >
                        Sign Now
                      </Button>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>

          {/* ── Documents tab ── */}
          <TabsContent value="documents" className="space-y-4">
            {/* Type-guided checklist */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Suggested Documents</p>
              {DOC_SLOTS.filter((slot) => !slot.veteranOnly || (infoForm['veteranStatus'] as boolean)).map((slot) => {
                const alreadyUploaded = docs.some((d) => d.documentType === slot.type && d.fileName.toLowerCase().includes(slot.label.toLowerCase().split(' ')[0].toLowerCase()));
                return (
                  <div key={slot.label} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.hint}</p>
                    </div>
                    {alreadyUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <SlotUploadButton
                        accessToken={accessToken}
                        documentType={slot.type}
                        label={slot.label}
                        onUploaded={() => void refreshDocs()}
                      />
                    )}
                  </div>
                );
              })}
            </Card>

            {/* All uploaded documents */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</p>
              <SlotUploadButton
                accessToken={accessToken}
                documentType="other"
                label="document"
                onUploaded={() => void refreshDocs()}
              />
            </div>

            <Card className="p-4">
              {docs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
              )}
            </Card>
          </TabsContent>

          {/* ── Messages tab ── */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="h-80 overflow-y-auto p-4 space-y-3">
                {!messagesLoaded && (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-1/2 ml-auto" />
                  </div>
                )}
                {messagesLoaded && messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No messages yet.</p>
                    <p className="text-xs mt-1">Send a message to your funeral home below.</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'family' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      msg.senderType === 'family'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}>
                      <p>{msg.body}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'family' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  rows={2}
                  className="resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="self-end"
                  disabled={!newMessage.trim() || sendingMessage}
                  onClick={() => void sendMessage()}
                >
                  Send
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ── Contacts tab ── */}
          <TabsContent value="contacts" className="space-y-3">
            {data.contacts.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">No contacts on file</Card>
            ) : (
              data.contacts.map((contact) => (
                <Card key={contact.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{contact.name}</p>
                      {contact.isPrimaryContact && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{contact.relationship}</p>
                  </div>
                </Card>
              ))
            )}
            {primaryContact && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Portal access is linked to {primaryContact.name}
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Grief support card — shown below tabs when case is completed */}
        {griefData?.unlocked && griefData.resources.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide px-2">Grief Support Resources</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              These resources are available to you during this difficult time.
            </p>
            <div className="space-y-3">
              {griefData.resources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{resource.title}</p>
                      {resource.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">{resource.category}</Badge>
                        {resource.durationMin && (
                          <span className="text-xs text-muted-foreground">{resource.durationMin} min</span>
                        )}
                        <a
                          href={resource.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-medium"
                        >
                          Watch →
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
