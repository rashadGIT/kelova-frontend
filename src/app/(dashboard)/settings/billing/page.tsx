'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface SubscriptionSummary {
  status: string;
  planTier: string;
  interval: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pastDueAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    trialing: {
      label: 'Free Trial',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Clock className="h-3 w-3" />,
    },
    past_due: {
      label: 'Payment Failed',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    unpaid: {
      label: 'Past Due',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: null,
    },
  };

  const v = variants[status] ?? variants['cancelled'];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${v.className}`}
    >
      {v.icon}
      {v.label}
    </span>
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

export default function BillingSettingsPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: sub, isLoading } = useQuery<SubscriptionSummary>({
    queryKey: ['billing-subscription'],
    queryFn: () => apiClient.get('/billing/subscription').then((r) => r.data),
  });

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const { data } = await apiClient.post('/billing/subscription/checkout', { interval });
      window.location.href = data.url;
    } catch {
      toast.error('Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { data } = await apiClient.post('/billing/portal');
      window.location.href = data.url;
    } catch {
      toast.error('Could not open billing portal. Please try again.');
      setPortalLoading(false);
    }
  }

  const status = sub?.status ?? 'trialing';
  const isTrialing = status === 'trialing';
  const isPastDue = status === 'past_due' || status === 'unpaid';
  const isActive = status === 'active';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Billing"
        description="Manage your Kelova subscription and payment method."
      />

      {/* Past-due alert */}
      {isPastDue && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800">Payment failed</p>
            <p className="text-sm text-amber-700">
              {sub?.pastDueAt
                ? `Your last payment failed on ${formatDate(sub.pastDueAt)}.`
                : 'Your last payment failed.'}{' '}
              Update your card to keep uninterrupted access.
            </p>
            <Button
              size="sm"
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening…' : 'Update Payment Method'}
            </Button>
          </div>
        </div>
      )}

      {/* Plan card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold capitalize">
                {isLoading ? '—' : (sub?.planTier ?? 'Kelova')} Plan
              </p>
              {sub?.interval && (
                <p className="text-sm text-muted-foreground capitalize">{sub.interval} billing</p>
              )}
            </div>
          </div>
          {!isLoading && <StatusBadge status={status} />}
        </div>

        {sub?.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            {sub.cancelAtPeriodEnd
              ? `Cancels on ${formatDate(sub.currentPeriodEnd)}`
              : `Renews ${formatDate(sub.currentPeriodEnd)}`}
          </p>
        )}

        {/* Actions */}
        {isActive && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {portalLoading ? 'Opening…' : 'Manage Billing'}
          </Button>
        )}
      </div>

      {/* Subscribe section — shown only for trialing tenants */}
      {isTrialing && (
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h3 className="font-semibold">Choose a plan</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Subscribe to keep full access to Kelova after your trial ends.
            </p>
          </div>

          {/* Interval toggle */}
          <div className="inline-flex rounded-md border p-1 gap-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                interval === 'monthly'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
              <span className="ml-1.5 font-normal opacity-75">$100/mo</span>
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                interval === 'yearly'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-1.5 font-normal opacity-75">$1,000/yr</span>
              <span className="ml-1.5 text-xs text-green-600 font-semibold">Save ~17%</span>
            </button>
          </div>

          {/* Price callout */}
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {interval === 'monthly' ? '$100' : '$1,000'}
              <span className="text-base font-normal text-muted-foreground ml-1">
                /{interval === 'monthly' ? 'month' : 'year'}
              </span>
            </p>
            {interval === 'yearly' && (
              <p className="text-sm text-green-600 font-medium mt-0.5">You save $200 vs monthly</p>
            )}
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="w-full sm:w-auto"
          >
            {checkoutLoading
              ? 'Redirecting to Stripe…'
              : `Subscribe — ${interval === 'yearly' ? '$1,000/yr' : '$100/mo'}`}
          </Button>

          <p className="text-xs text-muted-foreground">
            Secure checkout powered by Stripe. Cancel anytime from the billing portal.
          </p>
        </div>
      )}
    </div>
  );
}
