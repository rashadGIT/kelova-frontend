'use client';

import { use, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitPublicPreplanning } from '@/lib/api/preneed';

// ── Schemas per step ─────────────────────────────────────────────────────────

const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
});

const step2Schema = z.object({
  serviceType: z.enum(['burial', 'cremation', 'graveside', 'memorial'], {
    error: 'Please select a service type',
  }),
  notes: z.string().optional(),
});

const step3Schema = z.object({
  fundingType: z
    .enum(['Insurance', 'Trust', 'Cash', 'Combination'])
    .optional(),
  insuranceCompany: z.string().optional(),
  policyNumber: z.string().optional(),
  faceValue: z.coerce.number().nonnegative().optional().or(z.literal('')),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

const STEPS = ['Personal Info', 'Service Preferences', 'Funding', 'Review'];

const SERVICE_LABELS: Record<string, string> = {
  burial: 'Full Burial',
  cremation: 'Cremation',
  graveside: 'Graveside Service',
  memorial: 'Memorial Service',
};

const FUNDING_LABELS: Record<string, string> = {
  Insurance: 'Life Insurance Policy',
  Trust: 'Funeral Trust',
  Cash: 'Cash / Pay at Time of Need',
  Combination: 'Combination',
};

export default function PreplanningPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = use(params);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accumulated form data across steps
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Values | null>(null);

  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { serviceType: 'burial' },
  });
  const form3 = useForm<Step3Values>({ resolver: zodResolver(step3Schema) });

  const handleStep1 = (values: Step1Values) => {
    setStep1Data(values);
    setStep(1);
  };

  const handleStep2 = (values: Step2Values) => {
    setStep2Data(values);
    setStep(2);
  };

  const handleStep3 = (values: Step3Values) => {
    setStep3Data(values);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!step1Data || !step2Data) return;
    setIsSubmitting(true);
    try {
      const result = await submitPublicPreplanning(tenantSlug, {
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        dob: step1Data.dob || undefined,
        phone: step1Data.phone || undefined,
        email: step1Data.email || undefined,
        address: step1Data.address || undefined,
        serviceType: step2Data.serviceType,
        fundingType: step3Data?.fundingType ?? 'Cash',
        insuranceCompany: step3Data?.insuranceCompany || undefined,
        policyNumber: step3Data?.policyNumber || undefined,
        faceValue: step3Data?.faceValue
          ? Number(step3Data.faceValue)
          : undefined,
        notes: step2Data.notes || undefined,
      });
      setReferenceId(result.id.slice(-8).toUpperCase());
      setSubmitted(true);
    } catch {
      toast.error('Submission failed. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-semibold">Thank You</h1>
          <p className="text-muted-foreground text-sm">
            Your pre-need arrangements have been received. A funeral director
            will be in touch with you shortly.
          </p>
          <div className="bg-muted rounded-md px-4 py-3 text-sm">
            <p className="text-muted-foreground">Your reference number</p>
            <p className="font-mono font-semibold text-lg mt-1">{referenceId}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Please save this reference number for your records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">Pre-Need Planning</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plan ahead to ease the burden on your loved ones.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 transition-colors ${i < step ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 0 && (
          <form
            onSubmit={form1.handleSubmit(handleStep1)}
            className="space-y-4"
            noValidate
          >
            <h2 className="text-lg font-medium">Personal Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fn">First Name</Label>
                <Input
                  id="fn"
                  {...form1.register('firstName')}
                  aria-invalid={!!form1.formState.errors.firstName}
                />
                {form1.formState.errors.firstName && (
                  <p className="text-destructive text-sm mt-1">
                    {form1.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ln">Last Name</Label>
                <Input
                  id="ln"
                  {...form1.register('lastName')}
                  aria-invalid={!!form1.formState.errors.lastName}
                />
                {form1.formState.errors.lastName && (
                  <p className="text-destructive text-sm mt-1">
                    {form1.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="dob">
                Date of Birth{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input id="dob" type="date" {...form1.register('dob')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">
                  Phone{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input id="phone" {...form1.register('phone')} />
              </div>
              <div>
                <Label htmlFor="email">
                  Email{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form1.register('email')}
                  aria-invalid={!!form1.formState.errors.email}
                />
                {form1.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {form1.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="addr">
                Address{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input id="addr" {...form1.register('address')} />
            </div>
            <Button type="submit" className="w-full">
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Step 2: Service Preferences */}
        {step === 1 && (
          <form
            onSubmit={form2.handleSubmit(handleStep2)}
            className="space-y-4"
            noValidate
          >
            <h2 className="text-lg font-medium">Service Preferences</h2>
            <div>
              <Label>Service Type</Label>
              <Controller
                control={form2.control}
                name="serviceType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      aria-invalid={!!form2.formState.errors.serviceType}
                    >
                      <SelectValue placeholder="Select a service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SERVICE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form2.formState.errors.serviceType && (
                <p className="text-destructive text-sm mt-1">
                  {form2.formState.errors.serviceType.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="wishes">
                Special Wishes or Requests{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="wishes"
                rows={4}
                placeholder="Music preferences, readings, flowers, or any specific instructions..."
                {...form2.register('notes')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(0)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Funding */}
        {step === 2 && (
          <form
            onSubmit={form3.handleSubmit(handleStep3)}
            className="space-y-4"
            noValidate
          >
            <h2 className="text-lg font-medium">Funding Information</h2>
            <p className="text-sm text-muted-foreground">
              Let us know how you plan to fund your arrangements. This
              information helps us keep your records accurate.
            </p>
            <div>
              <Label>Funding Type</Label>
              <Controller
                control={form3.control}
                name="fundingType"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FUNDING_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="ins-co">
                Insurance Company{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="ins-co"
                placeholder="e.g. Mutual of Omaha"
                {...form3.register('insuranceCompany')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="policy-no">
                  Policy Number{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input id="policy-no" {...form3.register('policyNumber')} />
              </div>
              <div>
                <Label htmlFor="face-val">
                  Face Value ($){' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="face-val"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form3.register('faceValue')}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Review
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Review & Submit */}
        {step === 3 && step1Data && step2Data && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Review Your Information</h2>
            <div className="rounded-md border divide-y text-sm">
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Personal
                </p>
                <p className="font-medium">
                  {step1Data.firstName} {step1Data.lastName}
                </p>
                {step1Data.dob && (
                  <p className="text-muted-foreground">
                    DOB: {new Date(step1Data.dob).toLocaleDateString()}
                  </p>
                )}
                {step1Data.phone && (
                  <p className="text-muted-foreground">{step1Data.phone}</p>
                )}
                {step1Data.email && (
                  <p className="text-muted-foreground">{step1Data.email}</p>
                )}
                {step1Data.address && (
                  <p className="text-muted-foreground">{step1Data.address}</p>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Service
                </p>
                <p className="font-medium">
                  {SERVICE_LABELS[step2Data.serviceType]}
                </p>
                {step2Data.notes && (
                  <p className="text-muted-foreground mt-1">{step2Data.notes}</p>
                )}
              </div>
              {step3Data && (
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Funding
                  </p>
                  {step3Data.fundingType && (
                    <p className="font-medium">
                      {FUNDING_LABELS[step3Data.fundingType]}
                    </p>
                  )}
                  {step3Data.insuranceCompany && (
                    <p className="text-muted-foreground">
                      {step3Data.insuranceCompany}
                    </p>
                  )}
                  {step3Data.policyNumber && (
                    <p className="text-muted-foreground">
                      Policy #{step3Data.policyNumber}
                    </p>
                  )}
                  {step3Data.faceValue && (
                    <p className="text-muted-foreground">
                      Face value: ${Number(step3Data.faceValue).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
