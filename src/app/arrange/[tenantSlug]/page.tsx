'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TOTAL_STEPS = 4;

const SERVICE_TYPES = [
  { id: 'traditional', label: 'Traditional', description: 'Full funeral service with burial' },
  { id: 'cremation', label: 'Cremation', description: 'Cremation with memorial service' },
  { id: 'graveside', label: 'Graveside', description: 'Graveside committal service' },
  { id: 'memorial', label: 'Memorial', description: 'Memorial service without remains' },
];

const PACKAGES = [
  { id: 'essential', label: 'Essential', price: '$2,495', description: 'Core services and basic arrangements' },
  { id: 'comfort', label: 'Comfort', price: '$4,995', description: 'Enhanced services with additional support' },
  { id: 'celebration', label: 'Celebration of Life', price: '$7,995', description: 'Full tribute with personalization' },
];

export default function ArrangePage() {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-semibold">Request Received</h2>
          <p className="text-muted-foreground">
            Thank you. A funeral director will contact you shortly to confirm your arrangements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Begin Arrangements</h1>
          <p className="text-muted-foreground text-sm">We are here to guide you every step of the way</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 flex items-center gap-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Step {step} of {TOTAL_STEPS}</p>

        {/* Step 1: Service type */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Service Type</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceType(s.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    serviceType === s.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40'
                  }`}
                >
                  <p className="font-medium text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Package */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select a Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PACKAGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPackageId(p.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    packageId === p.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="font-bold text-sm">{p.price}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Contact info */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input type="tel" placeholder="(555) 000-0000" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Your Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Type</span>
                  <span className="font-medium capitalize">{serviceType ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium capitalize">{packageId ?? '—'}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By submitting, a funeral director will contact you to finalize all arrangements. No payment is required at this step.
              </p>
              <Button className="w-full" onClick={() => setSubmitted(true)}>
                Submit Request
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < TOTAL_STEPS && (
            <Button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={(step === 1 && !serviceType) || (step === 2 && !packageId)}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
