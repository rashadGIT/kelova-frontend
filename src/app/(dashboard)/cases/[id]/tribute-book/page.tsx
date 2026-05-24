'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TributeBookPage() {
  const [includeCondolences, setIncludeCondolences] = useState(true);
  const [includeGuestbook, setIncludeGuestbook] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader title="Tribute Book" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cover Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg h-36 flex items-center justify-center text-muted-foreground text-sm cursor-pointer hover:border-muted-foreground/50 transition-colors">
            Click to upload cover photo
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Include Condolences</p>
              <p className="text-xs text-muted-foreground">Add submitted condolence messages to the book</p>
            </div>
            <button
              onClick={() => setIncludeCondolences((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                includeCondolences ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  includeCondolences ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Include Guestbook</p>
              <p className="text-xs text-muted-foreground">Include service check-in guestbook entries</p>
            </div>
            <button
              onClick={() => setIncludeGuestbook((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                includeGuestbook ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  includeGuestbook ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Keepsake Hardcover Book</p>
            <p className="text-2xl font-bold mt-1">$89.00</p>
            <p className="text-xs text-muted-foreground">Ships within 7–10 business days</p>
          </div>
          <Button>Order Keepsake Book</Button>
        </CardContent>
      </Card>
    </div>
  );
}
