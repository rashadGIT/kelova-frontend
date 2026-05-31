'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { publicApiClient } from '@/lib/api/public-client';

interface InfoFormData {
  deceasedDob: string;
  birthState: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  faithTradition: string;
  veteranStatus: boolean;
  stateOfDeath: string;
  placeOfDeath: string;
  clothingDescription: string;
  personalEffects: string;
  officiantName: string;
}

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
  { value: 'unknown', label: 'Unknown' },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors';

export default function InfoFormPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = params.accessToken as string;

  const [form, setForm] = useState<InfoFormData>({
    deceasedDob: '',
    birthState: '',
    maritalStatus: '',
    occupation: '',
    education: '',
    faithTradition: '',
    veteranStatus: false,
    stateOfDeath: '',
    placeOfDeath: '',
    clothingDescription: '',
    personalEffects: '',
    officiantName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof InfoFormData>(key: K, value: InfoFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (form.deceasedDob) payload.deceasedDob = form.deceasedDob;
      if (form.birthState) payload.birthState = form.birthState;
      if (form.maritalStatus) payload.maritalStatus = form.maritalStatus;
      if (form.occupation) payload.occupation = form.occupation;
      if (form.education) payload.education = form.education;
      if (form.faithTradition) payload.faithTradition = form.faithTradition;
      payload.veteranStatus = form.veteranStatus;
      if (form.stateOfDeath) payload.stateOfDeath = form.stateOfDeath;
      if (form.placeOfDeath) payload.placeOfDeath = form.placeOfDeath;
      if (form.clothingDescription) payload.clothingDescription = form.clothingDescription;
      if (form.personalEffects) payload.personalEffects = form.personalEffects;
      if (form.officiantName) payload.officiantName = form.officiantName;

      await publicApiClient.patch(`/family-portal/${accessToken}/info-form`, payload);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again or contact your funeral home.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2
            className="h-14 w-14 mx-auto"
            style={{ color: 'hsl(var(--success))' }}
          />
          <h1 className="text-2xl font-semibold text-foreground">Thank you</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            We have received your information. Our team will review it and reach
            out if we have any questions.
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.push(`/family/${accessToken}`)}
          >
            Return to Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-5 py-6 md:px-8">
          <button
            onClick={() => router.push(`/family/${accessToken}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portal
          </button>
          <h1 className="text-2xl font-semibold text-foreground">Information Form</h1>
          <p className="text-base text-muted-foreground mt-1">
            Please fill in as much as you can. Leave anything blank that you
            don&apos;t know — we can gather the rest together.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto px-5 py-8 md:px-8 space-y-8">

          {/* Biographical */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Biographical Information
            </p>
            <Card className="p-5 space-y-5">
              <Field label="Date of birth">
                <input
                  type="date"
                  className={inputClass}
                  value={form.deceasedDob}
                  onChange={(e) => set('deceasedDob', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="State of birth">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Ohio"
                  value={form.birthState}
                  onChange={(e) => set('birthState', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="Marital status">
                <select
                  className={inputClass}
                  value={form.maritalStatus}
                  onChange={(e) => set('maritalStatus', e.target.value)}
                >
                  <option value="">Select…</option>
                  {MARITAL_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Separator />
              <Field label="Occupation" hint="Most recent or lifelong occupation">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Retired teacher"
                  value={form.occupation}
                  onChange={(e) => set('occupation', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="Highest level of education">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Bachelor's degree"
                  value={form.education}
                  onChange={(e) => set('education', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="Faith tradition or religion">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Baptist, Catholic, None"
                  value={form.faithTradition}
                  onChange={(e) => set('faithTradition', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="U.S. veteran?">
                <div className="flex gap-4 mt-1">
                  {[true, false].map((val) => (
                    <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="veteranStatus"
                        checked={form.veteranStatus === val}
                        onChange={() => set('veteranStatus', val)}
                        className="accent-primary h-4 w-4"
                      />
                      <span className="text-base">{val ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </Card>
          </div>

          {/* Place of death */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Place of Death
            </p>
            <Card className="p-5 space-y-5">
              <Field label="Location" hint="Hospital, home, care facility, etc.">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. St. Mary's Hospital, Columbus"
                  value={form.placeOfDeath}
                  onChange={(e) => set('placeOfDeath', e.target.value)}
                />
              </Field>
              <Separator />
              <Field label="State">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Ohio"
                  value={form.stateOfDeath}
                  onChange={(e) => set('stateOfDeath', e.target.value)}
                />
              </Field>
            </Card>
          </div>

          {/* Service preferences */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Service Preferences
            </p>
            <Card className="p-5 space-y-5">
              <Field
                label="Clothing"
                hint="What would you like your loved one to wear for the service?"
              >
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="e.g. Navy blue suit with a white shirt"
                  value={form.clothingDescription}
                  onChange={(e) => set('clothingDescription', e.target.value)}
                />
              </Field>
              <Separator />
              <Field
                label="Personal effects"
                hint="Jewelry or items to be placed with your loved one"
              >
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="e.g. Wedding ring, rosary"
                  value={form.personalEffects}
                  onChange={(e) => set('personalEffects', e.target.value)}
                />
              </Field>
              <Separator />
              <Field
                label="Officiant name"
                hint="Pastor, priest, celebrant, or other — leave blank if not applicable"
              >
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Pastor James Williams"
                  value={form.officiantName}
                  onChange={(e) => set('officiantName', e.target.value)}
                />
              </Field>
            </Card>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 pb-10">
            <button
              type="button"
              onClick={() => router.push(`/family/${accessToken}`)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Save for later
            </button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting ? 'Submitting…' : 'Submit Information'}
              {!submitting && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
}
