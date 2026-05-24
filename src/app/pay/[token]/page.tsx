'use client';

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-2">
            <div className="text-4xl mb-4">Thank you</div>
            <p className="text-muted-foreground text-sm">Your payment has been submitted for processing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Complete Your Payment</h1>
          <p className="text-muted-foreground text-sm">Reference: {token}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Amount Due</CardTitle>
              <span className="text-2xl font-bold">$1,450.00</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name on Card</label>
              <Input placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Card Number</label>
              <Input placeholder="1234 5678 9012 3456" maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Expiry</label>
                <Input placeholder="MM / YY" maxLength={7} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CVV</label>
                <Input placeholder="123" maxLength={4} type="password" />
              </div>
            </div>
            <Button className="w-full" onClick={() => setSubmitted(true)}>
              Pay Now
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Kelova. Your payment information is encrypted.
        </p>
      </div>
    </div>
  );
}
