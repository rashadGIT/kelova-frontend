'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RsvpPage({ params }: { params: { token: string } }) {
  const [attending, setAttending] = useState<'yes' | 'no' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-2">
            <h2 className="text-xl font-semibold">RSVP Received</h2>
            <p className="text-muted-foreground text-sm">Thank you for letting us know. We look forward to seeing you.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">RSVP for Service</h1>
          <p className="text-muted-foreground text-sm">Please let us know if you will be attending</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Your Name</label>
              <Input placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input type="tel" placeholder="(555) 000-0000" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Will you be attending?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAttending('yes')}
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                    attending === 'yes' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setAttending('no')}
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                    attending === 'no' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {attending === 'yes' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Number of Guests (including yourself)</label>
                <Input type="number" placeholder="1" min={1} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Any special notes or needs..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <Button className="w-full" onClick={() => setSubmitted(true)}>
              Submit RSVP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
