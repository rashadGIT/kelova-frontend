'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Download, CreditCard, RotateCcw, FileText } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getCasePayments,
  recordPayment,
  createCheckoutSession,
  createRefund,
} from '@/lib/api/payments';
import { generateReceipt } from '@/lib/api/documents';
import { syncQBInvoice, syncQBPayment } from '@/lib/api/integrations';
import type { IPayment } from '@/types';
import { formatDate } from '@/lib/utils/format-date';

const paymentSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  method: z.enum(['Cash', 'Check', 'Card', 'Wire', 'Other'], {
    errorMap: () => ({ message: 'Payment method is required' }),
  }),
});

const checkoutSchema = z.object({
  dollars: z
    .coerce
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  description: z.string().optional(),
});

const refundSchema = z.object({
  dollars: z.coerce.number().positive('Amount must be positive').optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type CheckoutFormValues = z.infer<typeof checkoutSchema>;
type RefundFormValues = z.infer<typeof refundSchema>;

function PaymentList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });

  const [recordOpen, setRecordOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  useEffect(() => {
    const status = searchParams.get('payment');
    if (status === 'success') {
      toast.success('Online payment received successfully.');
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
    } else if (status === 'cancelled') {
      toast.info('Payment was cancelled by the family.');
    }
  }, [searchParams, caseId, queryClient]);

  const recordForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
  });

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const refundForm = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
  });

  const recordMutation = useMutation({
    mutationFn: (values: PaymentFormValues) =>
      recordPayment(caseId, { amount: values.amount, method: values.method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      toast.success('Payment recorded.');
      setRecordOpen(false);
      recordForm.reset();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      createCheckoutSession(
        caseId,
        Math.round(values.dollars * 100),
        values.description,
      ),
    onSuccess: ({ url }) => {
      setCheckoutOpen(false);
      checkoutForm.reset();
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.info('Stripe payment page opened. Share the link with the family.');
    },
    onError: () => toast.error('Failed to create payment link. Check Stripe configuration.'),
  });

  const refundMutation = useMutation({
    mutationFn: (values: RefundFormValues) =>
      createRefund(
        caseId,
        values.dollars ? Math.round(values.dollars * 100) : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      toast.success('Refund issued successfully.');
      setRefundOpen(false);
      refundForm.reset();
    },
    onError: () => toast.error('Refund failed. No Stripe payment found for this case.'),
  });

  const qbSyncMutation = useMutation({
    mutationFn: async () => {
      await syncQBInvoice(caseId);
      if (payment) await syncQBPayment(caseId);
    },
    onSuccess: () => toast.success('Synced to QuickBooks.'),
    onError: () => toast.error('QuickBooks sync failed. Check integration settings.'),
  });

  const receiptMutation = useMutation({
    mutationFn: () => generateReceipt(caseId),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      toast.success('Receipt generated and opened.');
    },
    onError: () => toast.error('Failed to generate receipt.'),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const payment = data as IPayment | null;
  const totalAmount = Number(payment?.totalAmount ?? 0);
  const amountPaid = Number(payment?.amountPaid ?? 0);
  const outstanding = totalAmount - amountPaid;
  const isPaidInFull = outstanding <= 0 && totalAmount > 0;
  const hasStripePayment = !!payment?.stripePaymentIntentId;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent
          className="grid grid-cols-3 gap-4 text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-[hsl(var(--success))]">
              ${amountPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p
              className={`text-lg font-semibold ${isPaidInFull ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}
            >
              {isPaidInFull ? 'Paid in Full' : `$${outstanding.toFixed(2)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Payment History</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => qbSyncMutation.mutate()}
            disabled={qbSyncMutation.isPending}
          >
            {qbSyncMutation.isPending ? 'Syncing...' : 'Sync to QuickBooks'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => receiptMutation.mutate()}
            disabled={receiptMutation.isPending}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            {receiptMutation.isPending ? 'Generating...' : 'Generate Receipt'}
          </Button>

          {payment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const rows = [
                  ['Case ID', 'Total', 'Paid', 'Outstanding', 'Method', 'Date'],
                  [
                    caseId,
                    totalAmount.toFixed(2),
                    amountPaid.toFixed(2),
                    Math.max(0, outstanding).toFixed(2),
                    payment.method ?? '',
                    payment.createdAt
                      ? new Date(payment.createdAt).toLocaleDateString()
                      : '',
                  ],
                ];
                const csv = rows.map((r) => r.join(',')).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(
                  new Blob([csv], { type: 'text/csv' }),
                );
                a.download = `payment-${caseId}.csv`;
                a.click();
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}

          {/* Online payment link via Stripe */}
          <Dialog
            open={checkoutOpen}
            onOpenChange={(v) => {
              setCheckoutOpen(v);
              if (!v) checkoutForm.reset();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Send Payment Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Online Payment Link</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Creates a Stripe-hosted checkout page. Open and share the link
                with the family so they can pay by card.
              </p>
              <form
                onSubmit={checkoutForm.handleSubmit((v) =>
                  checkoutMutation.mutate(v),
                )}
                className="space-y-3"
                noValidate
              >
                <div>
                  <Label htmlFor="checkout-amount">Amount ($)</Label>
                  <Input
                    id="checkout-amount"
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    {...checkoutForm.register('dollars')}
                    aria-invalid={!!checkoutForm.formState.errors.dollars}
                  />
                  {checkoutForm.formState.errors.dollars && (
                    <p className="text-destructive text-sm mt-1">
                      {checkoutForm.formState.errors.dollars.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="checkout-desc">
                    Description{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="checkout-desc"
                    placeholder="Funeral Services — Johnson Family"
                    {...checkoutForm.register('description')}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={checkoutMutation.isPending}
                  className="w-full"
                >
                  {checkoutMutation.isPending
                    ? 'Creating link...'
                    : 'Create Payment Link'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Refund — only available if paid via Stripe */}
          {hasStripePayment && (
            <Dialog
              open={refundOpen}
              onOpenChange={(v) => {
                setRefundOpen(v);
                if (!v) refundForm.reset();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Refund</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Leave amount blank to refund the full payment.
                </p>
                <form
                  onSubmit={refundForm.handleSubmit((v) =>
                    refundMutation.mutate(v),
                  )}
                  className="space-y-3"
                  noValidate
                >
                  <div>
                    <Label htmlFor="refund-amount">
                      Refund Amount ($){' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      step="0.01"
                      placeholder={`${amountPaid.toFixed(2)} (full)`}
                      {...refundForm.register('dollars')}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={refundMutation.isPending}
                    className="w-full"
                  >
                    {refundMutation.isPending ? 'Issuing refund...' : 'Issue Refund'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Manual offline payment */}
          <Dialog
            open={recordOpen}
            onOpenChange={(v) => {
              setRecordOpen(v);
              if (!v) recordForm.reset();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={recordForm.handleSubmit((v) =>
                  recordMutation.mutate(v),
                )}
                className="space-y-3"
                noValidate
              >
                <div>
                  <Label htmlFor="payment-amount">Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...recordForm.register('amount')}
                    aria-invalid={!!recordForm.formState.errors.amount}
                  />
                  {recordForm.formState.errors.amount && (
                    <p className="text-destructive text-sm mt-1">
                      {recordForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="payment-method">Method</Label>
                  <Controller
                    control={recordForm.control}
                    name="method"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="payment-method"
                          aria-invalid={!!recordForm.formState.errors.method}
                        >
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Cash', 'Check', 'Card', 'Wire', 'Other'].map(
                            (m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {recordForm.formState.errors.method && (
                    <p className="text-destructive text-sm mt-1">
                      {recordForm.formState.errors.method.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={recordMutation.isPending}
                >
                  {recordMutation.isPending ? 'Recording...' : 'Record'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!payment ? (
        <p className="text-sm text-muted-foreground">
          No payments recorded yet.
        </p>
      ) : (
        <div className="rounded-md border divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium capitalize">
                {payment.method?.replace('_', ' ')}
                {payment.stripePaymentIntentId && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    via Stripe
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.createdAt)}
              </p>
              {payment.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.notes}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[hsl(var(--success))]">
                ${amountPaid.toFixed(2)} paid
              </p>
              {outstanding > 0 && (
                <p className="text-xs text-[hsl(var(--warning))]">
                  ${outstanding.toFixed(2)} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CasePaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PaymentList caseId={id} />
    </div>
  );
}
