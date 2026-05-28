'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SignatureCapture } from '@/components/signatures/signature-canvas';
import { CheckCircle2, ExternalLink, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { publicApiClient } from '@/lib/api/public-client';
import { cn } from '@/lib/utils/cn';

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  deceasedFirstName: z.string().min(1, 'First name is required'),
  deceasedLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  serviceType: z.enum(['burial', 'cremation', 'graveside', 'memorial'], {
    error: 'Select a service type',
  }),
  veteranStatus: z.boolean().default(false),
  placeOfDeath: z.string().max(200).optional(),
  // Extended fields
  maritalStatus: z.enum(['married', 'widowed', 'divorced', 'single', 'unknown']).optional(),
  stateOfDeath: z.string().max(2).optional(),
  birthState: z.string().max(2).optional(),
  occupation: z.string().max(150).optional(),
  faithTradition: z.string().max(100).optional(),
});

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address'),
  relationship: z.string().min(1, 'Relationship is required'),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  isFinanciallyResponsible: z.boolean().default(true),
});

const step2Schema = z.object({
  primary: contactSchema,
  hasSecondary: z.boolean().default(false),
  secondary: contactSchema.partial().optional(),
  // Authorized representative (merged into this step)
  informantName: z.string().min(2, 'Name is required').max(150),
  informantRelationship: z.string().min(1, 'Relationship is required').max(80),
  isAuthorizedRepresentative: z.literal(true, {
    error: 'You must confirm your authority to complete this form',
  }),
});

const step3Schema = z.object({
  notes: z.string().optional(),
});

const step4Schema = z.object({
  financialResponsibilityAcknowledgment: z.literal(true, {
    error: 'You must acknowledge financial responsibility to continue',
  }),
  howDidYouHearAboutUs: z.string().max(100).optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;
type Step4Values = z.infer<typeof step4Schema>;

type TokenState = 'pending' | 'intent_confirmed' | 'signing' | 'signed' | 'error';

interface SignatureToken {
  token: string;
  documentType: string;
  label: string;
}

// ─── Document text by type ───────────────────────────────────────────────────

function getDocumentSummary(documentType: string, tenantName: string): string {
  if (documentType === 'authorization') {
    return `I hereby authorize ${tenantName} to take custody of the remains and provide funeral services for the deceased. I affirm that I am the authorized next-of-kin or legal representative with the legal right to authorize these arrangements.`;
  }
  if (documentType === 'service_contract') {
    return `I acknowledge and accept financial responsibility for all funeral services, merchandise, and related costs as arranged with ${tenantName}. I understand that an itemized statement of goods and services will be provided, as required by the FTC Funeral Rule.`;
  }
  return `I authorize ${tenantName} to proceed with the services described in this document.`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Deceased', 'Contact', 'Preferences', 'Confirm', 'Sign'];
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors',
              s < current ? 'bg-primary border-primary text-primary-foreground'
                : s === current ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground',
            )}>
              {s < current ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn('text-xs hidden sm:block', s === current ? 'text-primary font-medium' : 'text-muted-foreground')}>
              {labels[s - 1]}
            </span>
          </div>
          {s < total && <div className={cn('h-0.5 flex-1 mx-1 mb-4', s < current ? 'bg-primary' : 'bg-muted')} />}
        </div>
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

function TokenStatusBadge({ state }: { state: TokenState }) {
  const config: Record<TokenState, { label: string; className: string }> = {
    pending:          { label: 'Pending',        className: 'bg-muted text-muted-foreground' },
    intent_confirmed: { label: 'Ready to Sign',  className: 'bg-blue-100 text-blue-700' },
    signing:          { label: 'Signing...',      className: 'bg-blue-100 text-blue-700' },
    signed:           { label: 'Signed',          className: 'bg-green-100 text-green-700' },
    error:            { label: 'Error',           className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = config[state];
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', className)}>
      {state === 'signing' ? <Loader2 className="inline h-3 w-3 animate-spin mr-1" /> : null}
      {label}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface IntakeFormProps {
  tenantSlug: string;
}

export function IntakeForm({ tenantSlug }: IntakeFormProps) {
  const TOTAL_STEPS = 5;

  // Page-level state
  const [tenantName, setTenantName] = useState('');
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-step accumulated data
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Values | null>(null);

  // Post-submit signing state
  const [familyAccessToken, setFamilyAccessToken] = useState<string | null>(null);
  const [signatureTokens, setSignatureTokens] = useState<SignatureToken[]>([]);
  const [tokenStates, setTokenStates] = useState<Record<string, TokenState>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [intentChecked, setIntentChecked] = useState(false);
  const [intentLoading, setIntentLoading] = useState(false);

  // Track if informant fields were manually edited (to avoid clobbering user input)
  const informantNameTouched = useRef(false);
  const informantRelTouched = useRef(false);

  // ── Fetch tenant info on mount ──────────────────────────────────────────
  useEffect(() => {
    publicApiClient.get<{ tenantName: string; tenantSlug: string }>(`/intake/${tenantSlug}`)
      .then((res) => {
        setTenantName(res.data.tenantName);
        setTenantLoading(false);
      })
      .catch(() => {
        setTenantError(true);
        setTenantLoading(false);
      });
  }, [tenantSlug]);

  // ── Forms ───────────────────────────────────────────────────────────────
  const step1Form = useForm<Step1Values>({
    resolver: standardSchemaResolver(step1Schema),
    defaultValues: step1Data ?? { serviceType: 'burial', veteranStatus: false },
  });

  const step2Form = useForm<Step2Values>({
    resolver: standardSchemaResolver(step2Schema),
    defaultValues: step2Data ?? { primary: { isFinanciallyResponsible: true }, hasSecondary: false },
  });

  const step3Form = useForm<Step3Values>({
    resolver: standardSchemaResolver(step3Schema),
    defaultValues: step3Data ?? {},
  });

  const step4Form = useForm<Step4Values>({
    resolver: standardSchemaResolver(step4Schema),
  });

  const hasSecondary = step2Form.watch('hasSecondary');

  // Auto-fill informant fields from primary contact when not manually touched
  useEffect(() => {
    const sub = step2Form.watch((values, { name }) => {
      if (name === 'primary.firstName' || name === 'primary.lastName') {
        if (!informantNameTouched.current) {
          const first = values.primary?.firstName ?? '';
          const last = values.primary?.lastName ?? '';
          step2Form.setValue('informantName', `${first} ${last}`.trim());
        }
      }
      if (name === 'primary.relationship') {
        if (!informantRelTouched.current) {
          step2Form.setValue('informantRelationship', values.primary?.relationship ?? '');
        }
      }
    });
    return () => sub.unsubscribe();
  }, [step2Form]);

  // ── Signing helpers ─────────────────────────────────────────────────────

  function setTokenState(token: string, state: TokenState) {
    setTokenStates((prev) => ({ ...prev, [token]: state }));
  }

  const allSigned = signatureTokens.length === 0 ||
    signatureTokens.every((t) => tokenStates[t.token] === 'signed');

  const anyError = signatureTokens.some((t) => tokenStates[t.token] === 'error');

  const canSign = signatureDataUrl !== null &&
    signerName.trim().length > 0 &&
    intentChecked &&
    signatureTokens.every((t) => tokenStates[t.token] === 'intent_confirmed' || tokenStates[t.token] === 'error');

  async function handleIntentConfirm(checked: boolean) {
    if (!checked || intentChecked) return;
    setIntentLoading(true);
    try {
      await Promise.all(
        signatureTokens.map((t) => publicApiClient.post(`/sign/${t.token}/intent`)),
      );
      signatureTokens.forEach((t) => setTokenState(t.token, 'intent_confirmed'));
      setIntentChecked(true);
    } catch {
      toast.error('Failed to confirm intent. Please try again.');
      setIntentChecked(false);
    } finally {
      setIntentLoading(false);
    }
  }

  async function handleSignAll() {
    const pending = signatureTokens.filter(
      (t) => tokenStates[t.token] !== 'signed',
    );
    for (const { token } of pending) {
      setTokenState(token, 'signing');
      try {
        await publicApiClient.post(`/sign/${token}`, {
          signatureData: signatureDataUrl,
          intentConfirmed: true,
        });
        setTokenState(token, 'signed');
      } catch {
        setTokenState(token, 'error');
      }
    }
  }

  // ── Step 4 submit → POST intake → advance to step 5 ────────────────────
  async function handleStep4Submit(values: Step4Values) {
    if (!step1Data || !step2Data || !step3Data) return;
    setIsSubmitting(true);
    try {
      const primary = step2Data.primary;
      const secondary = step2Data.hasSecondary ? step2Data.secondary : undefined;

      const { data } = await publicApiClient.post<{
        caseId: string;
        familyAccessToken: string;
        tenantName: string;
        signatureTokens: SignatureToken[];
      }>(`/intake/${tenantSlug}`, {
        deceasedName: `${step1Data.deceasedFirstName} ${step1Data.deceasedLastName}`.trim(),
        deceasedDob: step1Data.dateOfBirth || undefined,
        deceasedDod: step1Data.dateOfDeath || undefined,
        serviceType: step1Data.serviceType,
        veteranStatus: step1Data.veteranStatus,
        placeOfDeath: step1Data.placeOfDeath || undefined,
        maritalStatus: step1Data.maritalStatus || undefined,
        stateOfDeath: step1Data.stateOfDeath || undefined,
        birthState: step1Data.birthState || undefined,
        occupation: step1Data.occupation || undefined,
        faithTradition: step1Data.faithTradition || undefined,
        informantName: step2Data.informantName || undefined,
        informantRelationship: step2Data.informantRelationship || undefined,
        primaryContact: {
          name: `${primary.firstName} ${primary.lastName}`.trim(),
          relationship: primary.relationship,
          email: primary.email,
          phone: primary.phone,
          addressLine1: primary.addressLine1 || undefined,
          city: primary.city || undefined,
          state: primary.state || undefined,
          zip: primary.zip || undefined,
          isFinanciallyResponsible: primary.isFinanciallyResponsible,
        },
        ...(secondary && secondary.firstName && {
          secondaryContact: {
            name: `${secondary.firstName} ${secondary.lastName ?? ''}`.trim(),
            relationship: secondary.relationship ?? '',
            email: secondary.email || undefined,
            phone: secondary.phone || undefined,
            isFinanciallyResponsible: secondary.isFinanciallyResponsible ?? false,
          },
        }),
        notes: step3Data.notes || undefined,
        financialResponsibilityAcknowledgment: values.financialResponsibilityAcknowledgment,
        howDidYouHearAboutUs: values.howDidYouHearAboutUs || undefined,
      });

      setFamilyAccessToken(data.familyAccessToken);
      setSignatureTokens(data.signatureTokens);
      setTokenStates(Object.fromEntries(data.signatureTokens.map((t) => [t.token, 'pending' as TokenState])));
      setSignerName(step2Data.informantName);
      setStep(5);
    } catch {
      toast.error('Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Early states ────────────────────────────────────────────────────────

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="font-medium text-destructive">This intake form is unavailable.</p>
        <p className="text-sm text-muted-foreground">Please contact the funeral home directly for assistance.</p>
      </div>
    );
  }

  // ── Success state (all documents signed) ────────────────────────────────

  if (allSigned && familyAccessToken) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Thank you — your documents have been received</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Our team will be in touch shortly to discuss next steps.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`/family/${familyAccessToken}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Track Your Arrangements
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Bookmark this link to check on your case status at any time.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {/* ── Step 1: Deceased Info ──────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit((v) => { setStep1Data(v); setStep(2); })} className="space-y-5">
          <h2 className="text-lg font-semibold">About the Deceased</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">First Name <span className="text-destructive">*</span></Label>
              <Input {...step1Form.register('deceasedFirstName')} className="w-full text-base h-12" />
              <FieldError message={step1Form.formState.errors.deceasedFirstName?.message} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Last Name <span className="text-destructive">*</span></Label>
              <Input {...step1Form.register('deceasedLastName')} className="w-full text-base h-12" />
              <FieldError message={step1Form.formState.errors.deceasedLastName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Date of Birth</Label>
              <Input type="date" {...step1Form.register('dateOfBirth')} className="w-full h-12" />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Date of Death</Label>
              <Input type="date" {...step1Form.register('dateOfDeath')} className="w-full h-12" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Service Type <span className="text-destructive">*</span></Label>
            <Select
              value={step1Form.watch('serviceType')}
              onValueChange={(v) => step1Form.setValue('serviceType', v as Step1Values['serviceType'], { shouldValidate: true })}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {(['burial', 'cremation', 'graveside', 'memorial'] as const).map((v) => (
                  <SelectItem key={v} value={v} className="text-base py-3 capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={step1Form.formState.errors.serviceType?.message} />
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Place of Death</Label>
            <Input {...step1Form.register('placeOfDeath')} className="w-full text-base h-12" placeholder="e.g. Hospital, Home, Nursing Facility" />
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="veteranStatus"
              checked={step1Form.watch('veteranStatus')}
              onCheckedChange={(v) => step1Form.setValue('veteranStatus', !!v)}
            />
            <Label htmlFor="veteranStatus" className="font-normal cursor-pointer">
              The deceased was a U.S. military veteran
            </Label>
          </div>

          {/* Additional details — collapsible */}
          <AdditionalDeceasedDetails form={step1Form} />

          <Button type="submit" className="w-full h-12 text-base mt-2">Continue</Button>
        </form>
      )}

      {/* ── Step 2: Family Contact + Authorized Rep ────────────────── */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit((v) => { setStep2Data(v); setStep(3); })} className="space-y-5">
          <h2 className="text-lg font-semibold">Primary Contact</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">First Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('primary.firstName')} className="w-full text-base h-12" />
              <FieldError message={step2Form.formState.errors.primary?.firstName?.message} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Last Name <span className="text-destructive">*</span></Label>
              <Input {...step2Form.register('primary.lastName')} className="w-full text-base h-12" />
              <FieldError message={step2Form.formState.errors.primary?.lastName?.message} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Relationship <span className="text-destructive">*</span></Label>
            <Input {...step2Form.register('primary.relationship')} className="w-full text-base h-12" placeholder="e.g. Spouse, Child, Sibling" />
            <FieldError message={step2Form.formState.errors.primary?.relationship?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Phone <span className="text-destructive">*</span></Label>
              <Input type="tel" {...step2Form.register('primary.phone')} className="w-full text-base h-12" placeholder="(555) 000-0000" />
              <FieldError message={step2Form.formState.errors.primary?.phone?.message} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">Email <span className="text-destructive">*</span></Label>
              <Input type="email" {...step2Form.register('primary.email')} className="w-full text-base h-12" placeholder="you@email.com" />
              <FieldError message={step2Form.formState.errors.primary?.email?.message} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Street Address</Label>
            <Input {...step2Form.register('primary.addressLine1')} className="w-full text-base h-12" placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="font-medium">City</Label>
              <Input {...step2Form.register('primary.city')} className="w-full text-base h-12" />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">State</Label>
              <Input {...step2Form.register('primary.state')} className="w-full text-base h-12" placeholder="OH" maxLength={2} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">ZIP</Label>
              <Input {...step2Form.register('primary.zip')} className="w-full text-base h-12" />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="financiallyResponsible"
              checked={step2Form.watch('primary.isFinanciallyResponsible')}
              onCheckedChange={(v) => step2Form.setValue('primary.isFinanciallyResponsible', !!v)}
            />
            <Label htmlFor="financiallyResponsible" className="font-normal cursor-pointer">
              I am financially responsible for services
            </Label>
          </div>

          {/* Secondary contact */}
          <div className="border-t pt-5">
            {!hasSecondary ? (
              <button
                type="button"
                onClick={() => step2Form.setValue('hasSecondary', true)}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                <Plus className="h-4 w-4" /> Add another family contact
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Second Contact</h3>
                  <button type="button" onClick={() => step2Form.setValue('hasSecondary', false)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-medium">First Name</Label>
                    <Input {...step2Form.register('secondary.firstName')} className="w-full text-base h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-medium">Last Name</Label>
                    <Input {...step2Form.register('secondary.lastName')} className="w-full text-base h-12" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Relationship</Label>
                  <Input {...step2Form.register('secondary.relationship')} className="w-full text-base h-12" placeholder="e.g. Spouse, Child" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-medium">Phone</Label>
                    <Input type="tel" {...step2Form.register('secondary.phone')} className="w-full text-base h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-medium">Email</Label>
                    <Input type="email" {...step2Form.register('secondary.email')} className="w-full text-base h-12" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Authorized representative section */}
          <div className="border-t pt-5 space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Authorized Representative</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirm the name and relationship of the person completing this form. This will appear on signed documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  {...step2Form.register('informantName', {
                    onChange: () => { informantNameTouched.current = true; },
                  })}
                  className="w-full text-base h-12"
                  placeholder="Your full legal name"
                />
                <FieldError message={step2Form.formState.errors.informantName?.message} />
              </div>
              <div className="space-y-1">
                <Label className="font-medium">Your Relationship <span className="text-destructive">*</span></Label>
                <Input
                  {...step2Form.register('informantRelationship', {
                    onChange: () => { informantRelTouched.current = true; },
                  })}
                  className="w-full text-base h-12"
                  placeholder="e.g. Son, Daughter, Spouse"
                />
                <FieldError message={step2Form.formState.errors.informantRelationship?.message} />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="authorizedRep"
                checked={step2Form.watch('isAuthorizedRepresentative') === true}
                onCheckedChange={(v) =>
                  step2Form.setValue('isAuthorizedRepresentative', v === true ? true : (false as never), { shouldValidate: true })
                }
                className="mt-0.5"
              />
              <Label htmlFor="authorizedRep" className="font-normal cursor-pointer leading-relaxed">
                I am legally authorized to complete this form and sign documents on behalf of the family.
                <span className="text-destructive"> *</span>
              </Label>
            </div>
            <FieldError message={step2Form.formState.errors.isAuthorizedRepresentative?.message} />
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base">Continue</Button>
          </div>
        </form>
      )}

      {/* ── Step 3: Service Preferences ───────────────────────────── */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit((v) => { setStep3Data(v); setStep(4); })} className="space-y-5">
          <h2 className="text-lg font-semibold">Service Preferences</h2>
          <div className="space-y-1">
            <Label className="font-medium">Additional Notes</Label>
            <Textarea
              {...step3Form.register('notes')}
              rows={5}
              className="w-full text-base resize-none"
              placeholder="Any special requests, preferences, or information our team should know..."
            />
          </div>
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base">Continue</Button>
          </div>
        </form>
      )}

      {/* ── Step 4: Financial Acknowledgment ──────────────────────── */}
      {step === 4 && (
        <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-6">
          <h2 className="text-lg font-semibold">Confirmation</h2>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2 border">
            <p className="font-medium text-foreground">Financial Responsibility Statement</p>
            <p>
              By checking the box below, you acknowledge that you are authorizing{' '}
              {tenantName || 'our funeral home'} to begin making arrangements and that you accept financial
              responsibility for the services requested.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="financialAck"
              checked={step4Form.watch('financialResponsibilityAcknowledgment') === true}
              onCheckedChange={(v) =>
                step4Form.setValue('financialResponsibilityAcknowledgment', v === true ? true : (false as never))
              }
              className="mt-0.5"
            />
            <Label htmlFor="financialAck" className="font-normal cursor-pointer leading-relaxed">
              I acknowledge financial responsibility for funeral services and authorize the funeral home to proceed with arrangements.
              <span className="text-destructive"> *</span>
            </Label>
          </div>
          <FieldError message={step4Form.formState.errors.financialResponsibilityAcknowledgment?.message} />

          <div className="space-y-1">
            <Label className="font-medium">How did you hear about us?</Label>
            <Select onValueChange={(v) => step4Form.setValue('howDidYouHearAboutUs', v)}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select one (optional)" />
              </SelectTrigger>
              <SelectContent>
                {['Google Search', 'Family Referral', 'Friend Referral', 'Social Media', 'Previously Used', 'Other'].map((v) => (
                  <SelectItem key={v} value={v} className="text-base py-3">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(3)}>Back</Button>
            <Button type="submit" className="flex-1 h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Information'}
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 5: Sign Documents ─────────────────────────────────── */}
      {step === 5 && !allSigned && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Authorization & Electronic Signatures</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please review the following documents and provide your signature. By signing, you authorize{' '}
              <span className="font-medium text-foreground">{tenantName}</span> to proceed with funeral services.
            </p>
          </div>

          {/* Document cards */}
          <div className="space-y-3">
            {signatureTokens.map((t) => (
              <div key={t.token} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{t.label}</p>
                  <TokenStatusBadge state={tokenStates[t.token] ?? 'pending'} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getDocumentSummary(t.documentType, tenantName)}
                </p>
                {tokenStates[t.token] === 'error' && (
                  <p className="text-xs text-destructive">Failed to sign. Will retry when you click &quot;Complete Signing&quot;.</p>
                )}
              </div>
            ))}
          </div>

          {/* Signer name */}
          <div className="space-y-1">
            <Label htmlFor="signerName" className="font-medium">
              Your Full Legal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signerName"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="h-12 text-base"
              placeholder="Type your full legal name"
            />
          </div>

          {/* Intent checkbox — calls /sign/:token/intent for all tokens */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="intent"
              checked={intentChecked}
              disabled={intentLoading || intentChecked}
              onCheckedChange={(v) => handleIntentConfirm(!!v)}
              className="mt-0.5"
            />
            <Label htmlFor="intent" className="font-normal leading-relaxed cursor-pointer">
              I have read the above documents and intend to sign them electronically.
              {intentLoading && <span className="text-muted-foreground ml-1">(confirming...)</span>}
              <span className="text-destructive"> *</span>
            </Label>
          </div>

          {/* Signature canvas — disabled until intent confirmed */}
          <div className="space-y-2">
            <Label className="font-medium">
              Draw Your Signature <span className="text-destructive">*</span>
            </Label>
            <div className={cn(intentChecked ? undefined : 'opacity-40 pointer-events-none')}>
              <SignatureCapture onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
            </div>
            {!intentChecked && (
              <p className="text-xs text-muted-foreground">Confirm intent above to enable signature.</p>
            )}
            {intentChecked && signatureDataUrl && (
              <p className="text-xs text-green-700">Signature captured. You can redraw if needed.</p>
            )}
          </div>

          {/* Legal notice */}
          <p className="text-xs text-muted-foreground">
            By clicking &quot;Complete Signing&quot;, you agree that your electronic signature is legally binding under the Electronic Signatures in Global and National Commerce Act (ESIGN) and Uniform Electronic Transactions Act (UETA).
          </p>

          {anyError && (
            <p className="text-sm text-destructive">
              One or more documents failed to sign. Review the status above and click &quot;Complete Signing&quot; to retry.
            </p>
          )}

          <Button
            className="w-full h-12 text-base"
            onClick={handleSignAll}
            disabled={!canSign}
          >
            Complete Signing
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Additional deceased details (collapsible) ───────────────────────────────

function AdditionalDeceasedDetails({ form }: { form: ReturnType<typeof useForm<Step1Values>> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        Additional Details (optional)
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="space-y-1 pt-4">
            <Label className="font-medium">Marital Status</Label>
            <Select
              value={form.watch('maritalStatus') ?? ''}
              onValueChange={(v) => form.setValue('maritalStatus', v as Step1Values['maritalStatus'])}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(['married', 'widowed', 'divorced', 'single', 'unknown'] as const).map((v) => (
                  <SelectItem key={v} value={v} className="text-base py-3 capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-medium">State of Death</Label>
              <Input {...form.register('stateOfDeath')} className="w-full text-base h-12" placeholder="OH" maxLength={2} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">State of Birth</Label>
              <Input {...form.register('birthState')} className="w-full text-base h-12" placeholder="KY" maxLength={2} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Occupation</Label>
            <Input {...form.register('occupation')} className="w-full text-base h-12" placeholder="e.g. Retired Educator, Farmer" />
          </div>

          <div className="space-y-1">
            <Label className="font-medium">Faith Tradition</Label>
            <Input {...form.register('faithTradition')} className="w-full text-base h-12" placeholder="e.g. Baptist, Catholic, Jewish, None" />
          </div>
        </div>
      )}
    </div>
  );
}
