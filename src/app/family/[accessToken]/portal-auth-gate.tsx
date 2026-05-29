'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'request' | 'enter';

export function PortalAuthGate({
  token,
  maskedEmail,
}: {
  token: string;
  maskedEmail: string;
}) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const [step, setStep] = useState<Step>('request');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/family-portal/${token}/request-otp`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Failed to send code');
      }
      setStep('enter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/family-portal/${token}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Invalid code');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Verify your identity</h1>
          <p className="text-muted-foreground text-sm">
            {step === 'request'
              ? 'For your security, we need to verify your identity before showing arrangement details.'
              : `Enter the 6-digit code sent to ${maskedEmail || 'your email'}.`}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {step === 'request' ? 'Send verification code' : 'Enter your code'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'request' ? (
              <>
                {maskedEmail && (
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll send a code to{' '}
                    <span className="font-medium text-foreground">{maskedEmail}</span>
                  </p>
                )}
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button className="w-full" onClick={() => void sendCode()} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Code'}
                </Button>
              </>
            ) : (
              <>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    setError(null);
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void verifyCode();
                  }}
                  className="text-center text-2xl tracking-widest font-mono h-14"
                  autoFocus
                />
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={() => void verifyCode()}
                  disabled={loading || code.length !== 6}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setError(null);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resend code
                </button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Kelova · Having trouble?{' '}
          <span className="text-foreground">Contact your funeral home directly.</span>
        </p>
      </div>
    </div>
  );
}
