'use client';

import { useState } from 'react';
import { CheckCircle2, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InstallmentLinkData {
  token: string;
  installmentNumber: number;
  amount: string | number;
  dueDate: string | null;
  deceasedName: string | null;
  alreadyPaid: boolean;
}

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(amount),
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PayLinkView({
  data,
  token,
  success,
}: {
  data: InstallmentLinkData;
  token: string;
  success: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/payments/link/${token}/checkout`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Unable to initiate checkout');
      }
      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Payment Received</h2>
            {data.deceasedName && (
              <p className="text-muted-foreground text-sm">
                Thank you. Installment #{data.installmentNumber} for{' '}
                <span className="font-medium">{data.deceasedName}</span> has been paid.
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              You will receive a confirmation by email. You may close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.alreadyPaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Already Paid</h2>
            <p className="text-muted-foreground text-sm">
              Installment #{data.installmentNumber} has already been paid. No further action is
              needed.
            </p>
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
          {data.deceasedName && (
            <p className="text-muted-foreground text-sm">{data.deceasedName}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                Installment #{data.installmentNumber}
              </span>
              <span className="text-2xl font-bold">{formatCurrency(data.amount)}</span>
            </div>

            {data.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due {formatDate(data.dueDate)}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button className="w-full" onClick={() => void handlePay()} disabled={loading}>
              {loading ? 'Redirecting to checkout…' : `Pay ${formatCurrency(data.amount)}`}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Kelova · Payments processed by Stripe
        </p>
      </div>
    </div>
  );
}
