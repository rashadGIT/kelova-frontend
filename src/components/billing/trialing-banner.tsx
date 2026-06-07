'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  status: string;
}

export function TrialingBanner({ status }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (status === 'trialing') {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm">
        <span>
          You&apos;re on a free trial.{' '}
          <Link href="/settings/billing" className="underline font-semibold hover:opacity-80">
            Add a payment method to keep your account active →
          </Link>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (status === 'past_due') {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <span>
          Your payment failed.{' '}
          <Link href="/settings/billing" className="underline font-semibold hover:opacity-80">
            Update your card to avoid losing access →
          </Link>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
