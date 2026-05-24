'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckInPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-5xl">Thank you</div>
          <p className="text-lg font-medium">You&apos;re checked in!</p>
          <p className="text-muted-foreground text-sm">Thank you for being here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Service Check-In</h1>
          <p className="text-muted-foreground text-sm">Please sign in below</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Your Name</label>
              <Input placeholder="Full name" className="text-base h-12" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email (optional)</label>
              <Input type="email" placeholder="you@example.com" className="text-base h-12" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Condolence Message (optional)</label>
              <textarea
                rows={4}
                placeholder="Share a memory or kind word..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <Button
              className="w-full h-14 text-base"
              onClick={() => setSubmitted(true)}
            >
              Check In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
