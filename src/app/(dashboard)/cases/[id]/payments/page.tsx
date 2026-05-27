'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Download, CreditCard, RotateCcw, FileText } from 'lucide-react';
import {
  getPaymentPlan,
  createPaymentPlan,
  recordInstallmentPayment,
  updatePaymentPlanStatus,
} from '@/lib/api/payment-plans';
import type { IPaymentPlan, IPaymentInstallment } from '@/types';
import { cn } from '@/lib/utils/cn';
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
    .number({ error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  method: z.enum(['Cash', 'Check', 'Card', 'Wire', 'Other'], {
    error: 'Payment method is required',
  }),
});

const checkoutSchema = z.object({
  dollars: z
    .coerce
    .number({ error: 'Amount is required' })
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

      <div className="flex flex-wrap justify-between items-center gap-y-2">
        <h3 className="text-sm font-medium">Payment History</h3>
        <div className="flex flex-wrap items-center gap-2">
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

const FREQ_OPTIONS = [
  { label: 'Weekly (7 days)', value: 7 },
  { label: 'Bi-weekly (14 days)', value: 14 },
  { label: 'Monthly (30 days)', value: 30 },
  { label: 'Every 60 days', value: 60 },
  { label: 'Every 90 days', value: 90 },
];

const PLAN_STATUS_COLORS: Record<IPaymentPlan['status'], string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  defaulted: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

const INSTALLMENT_STATUS_COLORS: Record<IPaymentInstallment['status'], string> = {
  pending: 'bg-slate-100 text-slate-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  waived: 'bg-amber-100 text-amber-700',
};

const createPlanSchema = z.object({
  totalAmount: z.coerce.number().positive('Required'),
  downPayment: z.coerce.number().nonnegative(),
  numberOfInstallments: z.coerce.number().int().min(1).max(24),
  frequencyDays: z.coerce.number().int().positive(),
  startDate: z.string().min(1, 'Required'),
});

const recordInstallmentSchema = z.object({
  paidAmount: z.coerce.number().positive('Required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type CreatePlanValues = z.infer<typeof createPlanSchema>;
type RecordInstallmentValues = z.infer<typeof recordInstallmentSchema>;

function PaymentPlanTab({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['payment-plan', caseId],
    queryFn: () => getPaymentPlan(caseId),
  });

  const createForm = useForm<CreatePlanValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: { numberOfInstallments: 3, frequencyDays: 30, downPayment: 0 },
  });

  const recordForm = useForm<RecordInstallmentValues>({
    resolver: zodResolver(recordInstallmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (values: CreatePlanValues) => createPaymentPlan(caseId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Payment plan created.');
      createForm.reset();
    },
    onError: () => toast.error('Failed to create payment plan.'),
  });

  const recordMutation = useMutation({
    mutationFn: (values: RecordInstallmentValues) =>
      recordInstallmentPayment(payingInstallmentId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Payment recorded.');
      setPayingInstallmentId(null);
      recordForm.reset();
    },
    onError: () => toast.error('Failed to record payment.'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: IPaymentPlan['status']) =>
      updatePaymentPlanStatus(plan!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Plan status updated.');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!plan) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Create Payment Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pp-total">Total Amount ($)</Label>
                <Input
                  id="pp-total"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...createForm.register('totalAmount')}
                />
                {createForm.formState.errors.totalAmount && (
                  <p className="text-destructive text-sm mt-1">
                    {createForm.formState.errors.totalAmount.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="pp-down">Down Payment ($)</Label>
                <Input
                  id="pp-down"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...createForm.register('downPayment')}
                />
              </div>
              <div>
                <Label htmlFor="pp-count">Number of Installments</Label>
                <Input
                  id="pp-count"
                  type="number"
                  min={1}
                  max={24}
                  {...createForm.register('numberOfInstallments')}
                />
              </div>
              <div>
                <Label htmlFor="pp-freq">Payment Frequency</Label>
                <Controller
                  control={createForm.control}
                  name="frequencyDays"
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <SelectTrigger id="pp-freq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQ_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="pp-start">First Payment Date</Label>
                <Input id="pp-start" type="date" {...createForm.register('startDate')} />
                {createForm.formState.errors.startDate && (
                  <p className="text-destructive text-sm mt-1">
                    {createForm.formState.errors.startDate.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const paidCount = plan.installments.filter((i) => i.status === 'paid').length;
  const activeInstallment = payingInstallmentId
    ? plan.installments.find((i) => i.id === payingInstallmentId)
    : null;

  return (
    <div className="space-y-4">
      {/* Plan summary */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Payment Plan</p>
              <p className="text-xs text-muted-foreground">
                {plan.numberOfInstallments} installments ·{' '}
                {FREQ_OPTIONS.find((o) => o.value === plan.frequencyDays)?.label ?? `${plan.frequencyDays}-day`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STATUS_COLORS[plan.status]}`}
              >
                {plan.status}
              </span>
              {plan.status === 'active' && (
                <Select onValueChange={(v) => statusMutation.mutate(v as IPaymentPlan['status'])}>
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue placeholder="Override..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defaulted">Mark Defaulted</SelectItem>
                    <SelectItem value="cancelled">Cancel Plan</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>{paidCount} / {plan.numberOfInstallments} paid</span>
            <span>${Number(plan.totalAmount).toFixed(2)} total</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{
                width: `${plan.numberOfInstallments ? (paidCount / plan.numberOfInstallments) * 100 : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Installments table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Installments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {plan.installments.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">#{inst.installmentNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(inst.dueDate)}
                    {inst.paidAt && ` · Paid ${formatDate(inst.paidAt)}`}
                  </p>
                  {inst.paymentMethod && (
                    <p className="text-xs text-muted-foreground">{inst.paymentMethod}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">${Number(inst.amount).toFixed(2)}</p>
                    {inst.paidAmount != null && inst.status === 'paid' && (
                      <p className="text-xs text-green-600">
                        ${Number(inst.paidAmount).toFixed(2)} paid
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INSTALLMENT_STATUS_COLORS[inst.status]}`}
                  >
                    {inst.status}
                  </span>
                  {inst.status === 'pending' || inst.status === 'overdue' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPayingInstallmentId(inst.id);
                        recordForm.setValue('paidAmount', inst.amount);
                      }}
                    >
                      Record Payment
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Record payment dialog */}
      <Dialog
        open={!!payingInstallmentId}
        onOpenChange={(v) => {
          if (!v) { setPayingInstallmentId(null); recordForm.reset(); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Payment — Installment #{activeInstallment?.installmentNumber}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={recordForm.handleSubmit((v) => recordMutation.mutate(v))}
            className="space-y-3"
            noValidate
          >
            <div>
              <Label htmlFor="inst-amount">Amount Paid ($)</Label>
              <Input
                id="inst-amount"
                type="number"
                step="0.01"
                {...recordForm.register('paidAmount')}
              />
            </div>
            <div>
              <Label htmlFor="inst-method">Payment Method</Label>
              <Controller
                control={recordForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="inst-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Cash', 'Check', 'Card', 'Financing', 'Other'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="inst-notes">Notes</Label>
              <Input id="inst-notes" placeholder="Optional" {...recordForm.register('notes')} />
            </div>
            <Button type="submit" disabled={recordMutation.isPending} className="w-full">
              {recordMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PAGE_TABS = ['Payments', 'Payment Plan'] as const;
type PageTab = (typeof PAGE_TABS)[number];

export default function CasePaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<PageTab>('Payments');

  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="flex border-b mb-6">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm border-b-2 transition-colors',
              activeTab === tab
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Payments' ? (
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <PaymentList caseId={id} />
        </Suspense>
      ) : (
        <PaymentPlanTab caseId={id} />
      )}
    </div>
  );
}
