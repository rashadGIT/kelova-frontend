'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Phone,
  Calendar,
  Heart,
  CalendarCheck,
  FileCheck2,
  ClipboardList,
  Star,
  Sparkles,
  ClipboardEdit,
  Send,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { publicApiClient } from '@/lib/api/public-client';
import { cn } from '@/lib/utils/cn';
import type { PortalData } from './page';

const STAGE_ORDER = [
  'first_call',
  'arrangement_scheduled',
  'arrangement_complete',
  'in_preparation',
  'services_scheduled',
  'services_complete',
  'death_cert_filed',
  'closed',
] as const;

type StageName = (typeof STAGE_ORDER)[number];

const STAGE_CONFIG: Record<StageName, {
  label: string;
  description: (firstName: string) => string;
  Icon: React.ElementType;
}> = {
  first_call: {
    label: 'In Our Care',
    description: (n) => `We've received notice and are beginning arrangements for ${n} with care.`,
    Icon: Phone,
  },
  arrangement_scheduled: {
    label: 'Planning Together',
    description: () => "We're working with your family to plan a meaningful, personal service.",
    Icon: Calendar,
  },
  arrangement_complete: {
    label: 'Details Finalized',
    description: () => 'All service details have been thoughtfully finalized.',
    Icon: ClipboardList,
  },
  in_preparation: {
    label: 'Preparation',
    description: (n) => `${n} is being carefully and respectfully prepared in our care.`,
    Icon: Heart,
  },
  services_scheduled: {
    label: 'Service Arranged',
    description: () => 'The service date and all details have been confirmed.',
    Icon: CalendarCheck,
  },
  services_complete: {
    label: 'Service Held',
    description: () => 'We were honored to help your family say goodbye.',
    Icon: Star,
  },
  death_cert_filed: {
    label: 'Final Paperwork',
    description: () => 'We are processing the official documentation on your behalf.',
    Icon: FileCheck2,
  },
  closed: {
    label: 'Complete',
    description: (n) => `All arrangements for ${n} are complete. Thank you for trusting us.`,
    Icon: Sparkles,
  },
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  burial: 'Burial Service',
  cremation: 'Cremation Service',
  graveside: 'Graveside Service',
  memorial: 'Memorial Service',
};

function StageTimeline({ currentStage, firstName }: { currentStage: string; firstName: string }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage as StageName);

  return (
    <div>
      {STAGE_ORDER.map((stage, i) => {
        const config = STAGE_CONFIG[stage];
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isUpcoming = i > currentIndex;
        const isLast = i === STAGE_ORDER.length - 1;
        const { Icon } = config;

        return (
          <div key={stage}>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-0.5">
                {isDone ? (
                  <CheckCircle2
                    className="h-6 w-6 flex-shrink-0"
                    style={{ color: 'hsl(var(--success))' }}
                  />
                ) : isCurrent ? (
                  <div className="h-10 w-10 rounded-full bg-primary ring-4 ring-primary/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/25 flex-shrink-0" />
                )}
                {!isLast && (
                  <div
                    className={cn(
                      'w-px mt-1',
                      isDone ? 'bg-[hsl(var(--success))]' : 'bg-border',
                      isCurrent ? 'h-8' : 'h-5',
                    )}
                  />
                )}
              </div>

              <div className={cn('pb-4', isCurrent && 'pb-6')}>
                <p
                  className={cn(
                    isCurrent && 'text-base font-semibold text-foreground',
                    isDone && 'text-sm text-muted-foreground',
                    isUpcoming && 'text-sm text-muted-foreground/50',
                  )}
                >
                  {config.label}
                  {isCurrent && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(current)</span>
                  )}
                </p>
                {isCurrent && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {config.description(firstName)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiceDetailsCard({ serviceType, createdAt }: { serviceType: string; createdAt: string }) {
  return (
    <Card className="p-5">
      <div className="space-y-3 text-base">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium capitalize">{serviceType}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Care began</span>
          <span className="font-medium">
            {new Date(createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </Card>
  );
}

function DocumentRow({
  doc,
}: {
  doc: { id: string; fileName: string; documentType: string; uploaded: boolean };
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.fileName}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {doc.documentType.replace(/_/g, ' ')}
        </p>
      </div>
      {doc.uploaded ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--success))' }} />
      ) : (
        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
      )}
    </div>
  );
}

function UploadButton({
  accessToken,
  onUploaded,
  documentType = 'other',
  label = 'Share a Document',
  accept,
}: {
  accessToken: string;
  onUploaded: () => void;
  documentType?: string;
  label?: string;
  accept?: string;
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
      // Without this, the document row stays uploaded: false forever and
      // never surfaces in staff-facing lists (findByCase/findPhotos both
      // filter on uploaded: true) — this was missing entirely before.
      await publicApiClient.patch(`/family-portal/${accessToken}/documents/${data.documentId}/confirm`);
      toast.success(`${file.name} uploaded successfully`);
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
        accept={accept}
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
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading…' : label}
      </Button>
    </>
  );
}

interface PortalPhoto {
  id: string;
  fileName: string;
  url: string;
}

// Photo contribution is always available (so the family can add photos any
// time, for staff to pick from) — the PDF preview itself only appears once
// staff explicitly shares it (gated server-side by TributeBook.sharedWithFamilyAt).
function TributeBookSection({ accessToken }: { accessToken: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PortalPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const photosRes = await publicApiClient
      .get<PortalPhoto[]>(`/family-portal/${accessToken}/photos`)
      .catch(() => ({ data: [] as PortalPhoto[] }));
    setPhotos(photosRes.data);
    try {
      const pdfRes = await publicApiClient.get<{ url: string }>(
        `/family-portal/${accessToken}/tribute-book/pdf-url`,
      );
      setPdfUrl(pdfRes.data.url);
    } catch {
      // Not shared yet — a valid state, not an error to surface.
      setPdfUrl(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Tribute Book
      </p>
      <Card className="p-5 space-y-4">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-[500px] rounded-md border" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Your funeral home hasn&apos;t shared a tribute book draft yet — but you can
            add photos below for them to include.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Add Your Photos</p>
            <UploadButton
              accessToken={accessToken}
              documentType="photo"
              label="Add a Photo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onUploaded={() => void load()}
            />
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.fileName}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ))}
            </div>
          )}
          {pdfUrl && (
            <p className="text-xs text-muted-foreground mt-2">
              Have feedback on the book? Leave a note below and your funeral home will see it.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export function FamilyPortalView({ data, accessToken }: { data: PortalData; accessToken: string }) {
  const [docs, setDocs] = useState(data.documents);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const caseData = data.case!;

  const firstName = caseData.deceasedName.split(' ')[0];
  const serviceLabel = SERVICE_TYPE_LABEL[caseData.serviceType] ?? caseData.serviceType;
  const primaryContact = data.contacts.find((c) => c.isPrimaryContact);
  const isClosed = caseData.stage === 'closed';
  const infoSubmitted = Boolean(caseData.familyInfoSubmittedAt);

  async function sendMessage() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await publicApiClient.post(`/family-portal/${accessToken}/messages`, { body: message.trim() });
      setMessage('');
      setMessageSent(true);
      toast.success('Message sent. We will be in touch soon.');
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function refreshDocs() {
    setRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}`);
      if (res.ok) {
        const refreshed = (await res.json()) as PortalData;
        setDocs(refreshed.documents);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      {/* Mobile: compact, stacked. Desktop: wider, name at 5xl, status in top-right */}
      <div className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 md:py-12">
          <div className="md:flex md:items-end md:justify-between md:gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {isClosed ? 'In Loving Memory' : "We're caring for"}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
                {caseData.deceasedName}
              </h1>
              <p className="text-base text-muted-foreground mt-2">{serviceLabel}</p>
            </div>

            {/* Desktop only: quiet status pill in header */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0 pb-1">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--success))' }} />
              <span className="text-sm text-muted-foreground">
                {isClosed ? 'All arrangements complete' : 'No action needed from you'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 md:py-10">

        {/*
         * Layout strategy:
         *   Mobile  → flex-col, natural top-to-bottom order: reassurance first, then sidebar content
         *   Desktop → 2-col grid: left = sticky sidebar (stepper + details), right = main content
         *
         * We flip order with order-1/order-2 so that on mobile the reassurance card
         * appears before the stepper, while on desktop they land in separate columns.
         */}
        <div className="flex flex-col md:grid md:grid-cols-[280px_1fr] md:gap-12 md:items-start">

          {/* ── LEFT SIDEBAR (desktop) / after reassurance (mobile) ──────── */}
          <div className="order-2 md:order-1 mt-6 md:mt-0 md:sticky md:top-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Where Things Stand
              </p>
              <Card className="p-5">
                <StageTimeline currentStage={caseData.stage} firstName={firstName} />
              </Card>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Service Details
              </p>
              <ServiceDetailsCard serviceType={caseData.serviceType} createdAt={caseData.createdAt} />
            </div>
          </div>

          {/* ── RIGHT MAIN (desktop) / top of scroll (mobile) ────────────── */}
          <div className="order-1 md:order-2 space-y-6">

            {/* Action card — conditional on info form status */}
            {!infoSubmitted && !isClosed ? (
              <Card className="p-5 flex items-start gap-4 border-[hsl(var(--warning))]"
                style={{ background: 'hsl(var(--warning-bg))' }}>
                <ClipboardEdit
                  className="h-6 w-6 flex-shrink-0 mt-0.5 shrink-0"
                  style={{ color: 'hsl(var(--warning))' }}
                />
                <div className="flex-1">
                  <p className="text-base font-medium text-foreground">
                    We need some information from you
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Please fill out the arrangement information form so we have everything
                    we need to proceed. It takes about 5 minutes.
                  </p>
                  <Link
                    href={`/family/${accessToken}/info-form`}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ClipboardEdit className="h-4 w-4" />
                    Fill Out Information Form
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className="p-5 flex items-start gap-4">
                <CheckCircle2
                  className="h-6 w-6 flex-shrink-0 mt-0.5"
                  style={{ color: 'hsl(var(--success))' }}
                />
                <div>
                  <p className="text-base font-medium text-foreground">
                    {isClosed
                      ? 'All arrangements are complete.'
                      : "There's nothing you need to do right now."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {isClosed
                      ? `Thank you for trusting us to care for ${firstName}. We are honored to have served your family.`
                      : "We'll reach out if we need anything from you. You can check this page anytime for updates."}
                  </p>
                </div>
              </Card>
            )}

            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Documents</p>
                <UploadButton accessToken={accessToken} onUploaded={refreshDocs} />
              </div>
              <Card className="p-5">
                {refreshing ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : docs.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-base text-muted-foreground">No documents yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      You can share certificates, IDs, or other paperwork using the button above.
                    </p>
                  </div>
                ) : (
                  docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
                )}
              </Card>
            </div>

            {/* Family contacts */}
            {data.contacts.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Family Contacts
                </p>
                <div className="space-y-3">
                  {data.contacts.map((contact) => (
                    <Card key={contact.id} className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-base font-semibold text-muted-foreground">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{contact.relationship}</p>
                      </div>
                      {contact.isPrimaryContact && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border shrink-0">
                          Primary
                        </span>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Obituary draft (only shown once staff shares it) */}
            {data.obituary && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Obituary Draft
                </p>
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <ScrollText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                        {data.obituary.plainText}
                      </p>
                      <p className="text-sm text-muted-foreground mt-3">
                        Have feedback on the draft? Leave a note below and your funeral home will see it.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <TributeBookSection accessToken={accessToken} />

            {/* Send us a message */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Send Us a Message
              </p>
              <Card className="p-5">
                {messageSent ? (
                  <div className="flex items-center gap-3 py-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--success))' }} />
                    <p className="text-base text-muted-foreground">
                      Message received. We will be in touch soon.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      rows={3}
                      placeholder="Ask a question or share anything on your mind…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button
                      size="sm"
                      disabled={sending || !message.trim()}
                      onClick={sendMessage}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sending ? 'Sending…' : 'Send Message'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t mt-4">
        <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            Questions or concerns? Please contact your funeral home directly.
          </p>
          {primaryContact && (
            <p className="text-xs text-muted-foreground/50 mt-1">
              Portal access is linked to {primaryContact.name}
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
