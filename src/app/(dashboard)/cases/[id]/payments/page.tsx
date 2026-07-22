'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Download, CreditCard, RotateCcw, FileText, Plus, X, ChevronDown } from 'lucide-react';
import {
  getPaymentPlan,
  createPaymentPlan,
  recordInstallmentPayment,
  updatePaymentPlanStatus,
} from '@/lib/api/payment-plans';
import type { IPaymentPlan, IPaymentInstallment, ICaseLineItem } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { CaseDetailLayout } from '@/components/cases/case-detail-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
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
import { generateReceipt, generateGplPdf } from '@/lib/api/documents';
import { syncQBInvoice, syncQBPayment } from '@/lib/api/integrations';
import { getCaseLineItems, addCaseLineItem, removeCaseLineItem } from '@/lib/api/case-line-items';
import { getPriceList } from '@/lib/api/price-list';
import {
  getCaseMerchandise,
  getMerchandise,
  addCaseMerchandise,
  removeCaseMerchandise,
  type CaseMerchandiseSelection,
} from '@/lib/api/merchandise';
import type { IPayment } from '@/types';
import { formatDate } from '@/lib/utils/format-date';

const paymentSchema = z.object({
  amountPaid: z.coerce
    .number({ error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  method: z.enum(['Cash', 'Check', 'Card', 'Wire', 'Other'], {
    error: 'Payment method is required',
  }),
});

const checkoutSchema = z.object({
  dollars: z.coerce
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

function CasePaymentsView({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });
  // Shares the ['payment-plan', caseId] cache entry with PaymentPlanStrip —
  // needed here so paid installments (including the down payment) can be
  // shown in Payment History, not just the generic lump-sum ledger entry.
  const { data: plan } = useQuery({
    queryKey: ['payment-plan', caseId],
    queryFn: () => getPaymentPlan(caseId),
  });

  const [recordOpen, setRecordOpen] = useState(false);
  const [overpayConfirm, setOverpayConfirm] = useState<PaymentFormValues | null>(null);
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
    resolver: standardSchemaResolver(paymentSchema),
  });

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: standardSchemaResolver(checkoutSchema),
  });

  const refundForm = useForm<RefundFormValues>({
    resolver: standardSchemaResolver(refundSchema),
  });

  const recordMutation = useMutation({
    mutationFn: (values: PaymentFormValues) =>
      recordPayment(caseId, { amountPaid: values.amountPaid, method: values.method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Payment recorded.');
      setRecordOpen(false);
      setOverpayConfirm(null);
      recordForm.reset();
    },
  });

  // outstanding is computed below (after `data` resolves), so this is wired
  // up via a stable callback that closes over the current render's value.
  const submitRecordPayment = (values: PaymentFormValues, outstandingNow: number) => {
    const excess = values.amountPaid - outstandingNow;
    if (excess > 0.005) {
      setOverpayConfirm(values);
      return;
    }
    recordMutation.mutate(values);
  };

  const checkoutMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      createCheckoutSession(caseId, Math.round(values.dollars * 100), values.description),
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
      createRefund(caseId, values.dollars ? Math.round(values.dollars * 100) : undefined),
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
      if (hasRecordedPayment) await syncQBPayment(caseId);
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

  const gplMutation = useMutation({
    mutationFn: () => generateGplPdf(caseId),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      toast.success('GPL PDF generated and opened.');
    },
    onError: () => toast.error('Failed to generate GPL PDF.'),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load payment summary for this case.
        </CardContent>
      </Card>
    );
  }

  const payment = data as IPayment;
  const totalAmount = Number(payment.totalAmount);
  const amountPaid = Number(payment.amountPaid);
  const outstanding = totalAmount - amountPaid;
  const isPaidInFull = outstanding <= 0 && totalAmount > 0;
  const hasStripePayment = !!payment.stripePaymentIntentId;

  // Live "what's left after this payment" preview in the Record Payment dialog.
  const enteredAmount = Number(recordForm.watch('amountPaid')) || 0;
  const remainingAfterPayment = Math.max(0, outstanding) - enteredAmount;

  // Payment History must reflect every way money can be recorded on a case —
  // the generic lump-sum ledger entry AND any paid plan installments
  // (including the down payment, which is marked paid at plan creation and
  // never touches the generic ledger at all).
  const installmentHistory = (plan?.installments ?? [])
    .filter((i) => i.status === 'paid')
    .map((i) => ({
      id: i.id,
      title: i.isDownPayment ? 'Down Payment' : `Installment #${i.installmentNumber}`,
      sublabel: i.paymentMethod ? i.paymentMethod.replace('_', ' ') : undefined,
      amount: Number(i.paidAmount ?? i.amount),
      date: i.paidAt,
      notes: i.notes,
    }));
  const installmentsPaidTotal = installmentHistory.reduce((sum, e) => sum + e.amount, 0);
  // `amountPaid` from the API is already ledger + paid installments combined
  // (see PaymentsService.findByCase) — back out the ledger-only portion so
  // it isn't double-counted against the installment entries above.
  const ledgerAmount = amountPaid - installmentsPaidTotal;
  const ledgerHistory =
    payment.method && ledgerAmount > 0.005
      ? [
          {
            id: payment.id ?? 'ledger',
            title: payment.method.replace('_', ' '),
            sublabel: payment.stripePaymentIntentId ? 'via Stripe' : undefined,
            amount: ledgerAmount,
            date: payment.createdAt,
            notes: payment.notes,
          },
        ]
      : [];
  const historyEntries = [...ledgerHistory, ...installmentHistory].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  const hasRecordedPayment = historyEntries.length > 0;

  return (
    <CaseDetailLayout
      main={
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent
              className="flex flex-col divide-y divide-border/60 sm:grid sm:grid-cols-3 sm:gap-4 sm:divide-y-0 sm:text-center"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-center justify-between py-2 first:pt-0 sm:block sm:py-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between py-2 sm:block sm:py-0">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold text-[hsl(var(--success))]">
                  ${amountPaid.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between py-2 last:pb-0 sm:block sm:py-0">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p
                  className={`text-lg font-semibold ${isPaidInFull ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}
                >
                  {isPaidInFull ? 'Paid in Full' : `$${outstanding.toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <ItemizedChargesSection caseId={caseId} />

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

              <Button
                size="sm"
                variant="outline"
                onClick={() => gplMutation.mutate()}
                disabled={gplMutation.isPending}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {gplMutation.isPending ? 'Generating...' : 'Generate GPL PDF'}
              </Button>

              {hasRecordedPayment && (
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
                        payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '',
                      ],
                    ];
                    const csv = rows.map((r) => r.join(',')).join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
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
                    Creates a Stripe-hosted checkout page. Open and share the link with the family
                    so they can pay by card.
                  </p>
                  <form
                    onSubmit={checkoutForm.handleSubmit((v) => checkoutMutation.mutate(v))}
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
                        Description <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="checkout-desc"
                        placeholder="Funeral Services — Johnson Family"
                        {...checkoutForm.register('description')}
                      />
                    </div>
                    <Button type="submit" disabled={checkoutMutation.isPending} className="w-full">
                      {checkoutMutation.isPending ? 'Creating link...' : 'Create Payment Link'}
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
                      onSubmit={refundForm.handleSubmit((v) => refundMutation.mutate(v))}
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
                  if (!v) {
                    recordForm.reset();
                    setOverpayConfirm(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Record Payment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                  </DialogHeader>
                  {overpayConfirm ? (
                    <div className="space-y-3">
                      <p className="text-sm text-[hsl(var(--warning))]">
                        ${overpayConfirm.amountPaid.toFixed(2)} exceeds the outstanding balance
                        of ${Math.max(0, outstanding).toFixed(2)} by $
                        {(overpayConfirm.amountPaid - outstanding).toFixed(2)}. Record anyway?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setOverpayConfirm(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={recordMutation.isPending}
                          onClick={() => recordMutation.mutate(overpayConfirm)}
                        >
                          {recordMutation.isPending ? 'Recording...' : 'Record Anyway'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={recordForm.handleSubmit((v) => submitRecordPayment(v, outstanding))}
                      className="space-y-3"
                      noValidate
                    >
                      <p className="text-sm text-muted-foreground">
                        Outstanding balance:{' '}
                        <span className="font-medium text-foreground">
                          ${Math.max(0, outstanding).toFixed(2)}
                        </span>
                      </p>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="payment-amount">Amount</Label>
                          {outstanding > 0 && (
                            <button
                              type="button"
                              className="text-xs font-medium text-primary hover:underline"
                              onClick={() =>
                                recordForm.setValue('amountPaid', outstanding, {
                                  shouldValidate: true,
                                })
                              }
                            >
                              Pay Remaining Balance
                            </button>
                          )}
                        </div>
                        <Input
                          id="payment-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...recordForm.register('amountPaid')}
                          aria-invalid={!!recordForm.formState.errors.amountPaid}
                        />
                        {recordForm.formState.errors.amountPaid && (
                          <p className="text-destructive text-sm mt-1">
                            {recordForm.formState.errors.amountPaid.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="payment-method">Method</Label>
                        <Controller
                          control={recordForm.control}
                          name="method"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger
                                id="payment-method"
                                aria-invalid={!!recordForm.formState.errors.method}
                              >
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Cash', 'Check', 'Card', 'Wire', 'Other'].map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
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
                      {enteredAmount > 0 && (
                        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Outstanding now</span>
                            <span>${Math.max(0, outstanding).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>This payment</span>
                            <span>-${enteredAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium pt-1 border-t border-border">
                            <span>Remaining after payment</span>
                            <span
                              className={
                                remainingAfterPayment <= 0
                                  ? 'text-[hsl(var(--success))]'
                                  : 'text-[hsl(var(--warning))]'
                              }
                            >
                              {remainingAfterPayment <= 0
                                ? 'Paid in Full'
                                : `$${remainingAfterPayment.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      )}
                      <Button type="submit" disabled={recordMutation.isPending}>
                        {recordMutation.isPending ? 'Recording...' : 'Record'}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {!hasRecordedPayment ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div
              className="rounded-xl border border-border divide-y divide-border/60"
              data-testid="payment-history-list"
            >
              {historyEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {entry.title}
                      {entry.sublabel && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal capitalize">
                          {entry.sublabel}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--success))]">
                    ${entry.amount.toFixed(2)} paid
                  </p>
                </div>
              ))}
              {outstanding > 0 && (
                <div className="flex items-center justify-end px-4 py-2">
                  <p className="text-xs text-[hsl(var(--warning))]">
                    ${outstanding.toFixed(2)} remaining
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      }
      sidebar={<PaymentPlanStrip caseId={caseId} caseTotal={totalAmount} />}
    />
  );
}

function toStartCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type ChargeRow = {
  id: string;
  source: 'charge' | 'merchandise';
  categoryLabel: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

function toChargeRows(lineItems: ICaseLineItem[], merch: CaseMerchandiseSelection[]): ChargeRow[] {
  const charges: ChargeRow[] = lineItems.map((li) => ({
    id: li.id,
    source: 'charge',
    categoryLabel: toStartCase(li.priceListItem.category),
    name: li.priceListItem.name,
    quantity: li.quantity,
    unitPrice: Number(li.unitPrice),
    total: Number(li.total),
  }));
  const merchandise: ChargeRow[] = merch.map((m) => ({
    id: m.id,
    source: 'merchandise',
    categoryLabel: toStartCase(m.item.category),
    name: m.item.name,
    quantity: m.quantity,
    unitPrice: Number(m.priceAtTime),
    total: Number(m.priceAtTime) * m.quantity,
  }));
  return [...charges, ...merchandise].sort(
    (a, b) => a.categoryLabel.localeCompare(b.categoryLabel) || a.name.localeCompare(b.name),
  );
}

type CatalogEntry = {
  id: string;
  source: 'charge' | 'merchandise';
  categoryLabel: string;
  name: string;
  price: number;
};

function ItemizedChargesSection({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [quantity, setQuantity] = useState('1');

  const { data: lineItems, isLoading: lineItemsLoading } = useQuery({
    queryKey: ['case-line-items', caseId],
    queryFn: () => getCaseLineItems(caseId),
  });

  const { data: merchSelections, isLoading: merchLoading } = useQuery({
    queryKey: ['case-merchandise', caseId],
    queryFn: () => getCaseMerchandise(caseId),
  });

  const { data: priceListCatalog } = useQuery({
    queryKey: ['price-list'],
    queryFn: () => getPriceList(),
    enabled: addOpen,
  });

  const { data: merchandiseCatalog } = useQuery({
    queryKey: ['merchandise'],
    queryFn: () => getMerchandise(),
    enabled: addOpen,
  });

  const invalidateCharges = () => {
    queryClient.invalidateQueries({ queryKey: ['case-line-items', caseId] });
    queryClient.invalidateQueries({ queryKey: ['case-merchandise', caseId] });
    // Payment Summary's Total is derived from these same charges server-side
    // (CaseChargesService.getCaseTotal) — without this it goes stale the
    // moment a charge is added or removed.
    queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
  };

  const addChargeMutation = useMutation({
    mutationFn: async (entry: CatalogEntry): Promise<void> => {
      const qty = parseInt(quantity, 10) || 1;
      if (entry.source === 'charge') {
        await addCaseLineItem(caseId, { priceListItemId: entry.id, quantity: qty });
      } else {
        await addCaseMerchandise(caseId, { itemId: entry.id, quantity: qty });
      }
    },
    onSuccess: () => {
      invalidateCharges();
      toast.success('Charge added.');
      setAddOpen(false);
      setSelectedEntry(null);
      setSearch('');
      setQuantity('1');
    },
    onError: () => toast.error('Failed to add charge.'),
  });

  const removeChargeMutation = useMutation({
    mutationFn: (row: ChargeRow) =>
      row.source === 'charge'
        ? removeCaseLineItem(caseId, row.id)
        : removeCaseMerchandise(caseId, row.id),
    onSuccess: () => {
      invalidateCharges();
      toast.success('Charge removed.');
    },
    onError: () => toast.error('Failed to remove charge.'),
  });

  if (lineItemsLoading || merchLoading) return <Skeleton className="h-40 w-full" />;

  const rows = toChargeRows(lineItems ?? [], merchSelections ?? []);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  const catalogEntries: CatalogEntry[] = [
    ...(priceListCatalog ?? []).map((p) => ({
      id: p.id,
      source: 'charge' as const,
      categoryLabel: toStartCase(p.category),
      name: p.name,
      price: Number(p.price),
    })),
    ...(merchandiseCatalog ?? []).map((m) => ({
      id: m.id,
      source: 'merchandise' as const,
      categoryLabel: toStartCase(m.category),
      name: m.name,
      price: Number(m.priceRetail),
    })),
  ].filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse itemized charges' : 'Expand itemized charges'}
          className="flex items-center gap-1.5 text-left"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              !expanded && '-rotate-90',
            )}
          />
          <CardTitle className="text-base">Itemized Charges</CardTitle>
        </button>
        <Dialog
          open={addOpen}
          onOpenChange={(v) => {
            setAddOpen(v);
            if (!v) {
              setSelectedEntry(null);
              setSearch('');
              setQuantity('1');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Charge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Charge</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Search professional services, merchandise..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedEntry(null);
                }}
              />
              {!selectedEntry && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {catalogEntries.map((entry) => (
                    <button
                      key={`${entry.source}-${entry.id}`}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:border-primary transition-colors"
                    >
                      <span>
                        <span className="text-sm font-medium">{entry.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {entry.categoryLabel}
                        </span>
                      </span>
                      <span className="text-sm font-medium">${entry.price.toFixed(2)}</span>
                    </button>
                  ))}
                  {catalogEntries.length === 0 && (
                    <p className="text-sm text-muted-foreground">No matching items.</p>
                  )}
                </div>
              )}
              {selectedEntry && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border px-3 py-2">
                    <p className="text-sm font-medium">{selectedEntry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedEntry.categoryLabel} · ${selectedEntry.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="charge-quantity">Quantity</Label>
                    <Input
                      id="charge-quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedEntry(null)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={addChargeMutation.isPending}
                      onClick={() => addChargeMutation.mutate(selectedEntry)}
                    >
                      {addChargeMutation.isPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-4">No charges added yet.</p>
        ) : (
          <>
            {expanded && (
              <div className="divide-y divide-border/60">
                {rows.map((row) => (
                  <div
                    key={`${row.source}-${row.id}`}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {row.name}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          {row.categoryLabel}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.quantity} × ${row.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium">${row.total.toFixed(2)}</p>
                      <button
                        type="button"
                        aria-label={`Remove ${row.name}`}
                        onClick={() => removeChargeMutation.mutate(row)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              className={cn(
                'flex items-center justify-between px-6 py-3',
                expanded && 'border-t border-border',
              )}
            >
              <p className="text-sm font-medium">Total</p>
              <p className="text-sm font-semibold">${grandTotal.toFixed(2)}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const FREQ_OPTIONS = [
  { label: 'Weekly (7 days)', value: 7 },
  { label: 'Bi-weekly (14 days)', value: 14 },
  { label: 'Monthly (30 days)', value: 30 },
  { label: 'Every 60 days', value: 60 },
  { label: 'Every 90 days', value: 90 },
];

const PLAN_STATUS_STYLES: Record<IPaymentPlan['status'], string> = {
  active: 'bg-[hsl(var(--primary)/0.1)] text-primary',
  completed: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]',
  defaulted: 'bg-[hsl(var(--destructive-bg))] text-[hsl(var(--destructive))]',
  cancelled: 'bg-muted text-muted-foreground',
};

const INSTALLMENT_STATUS_STYLES: Record<IPaymentInstallment['status'], string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]',
  overdue: 'bg-[hsl(var(--destructive-bg))] text-[hsl(var(--destructive))]',
  waived: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]',
};

const createPlanSchema = z.object({
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

function PaymentPlanStrip({ caseId, caseTotal }: { caseId: string; caseTotal: number }) {
  const queryClient = useQueryClient();
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['payment-plan', caseId],
    queryFn: () => getPaymentPlan(caseId),
  });

  const createForm = useForm<CreatePlanValues>({
    resolver: standardSchemaResolver(createPlanSchema),
    defaultValues: { numberOfInstallments: 3, frequencyDays: 30, downPayment: 0 },
  });

  const recordForm = useForm<RecordInstallmentValues>({
    resolver: standardSchemaResolver(recordInstallmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (values: CreatePlanValues) => createPaymentPlan(caseId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Payment plan created.');
      createForm.reset();
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to create payment plan.'),
  });

  const recordMutation = useMutation({
    mutationFn: (values: RecordInstallmentValues) =>
      recordInstallmentPayment(payingInstallmentId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      toast.success('Payment recorded.');
      setPayingInstallmentId(null);
      setOverpayConfirm(null);
      recordForm.reset();
    },
    onError: () => toast.error('Failed to record payment.'),
  });

  const [overpayConfirm, setOverpayConfirm] = useState<RecordInstallmentValues | null>(null);
  const submitInstallmentPayment = (values: RecordInstallmentValues, dueAmount: number) => {
    if (values.paidAmount - dueAmount > 0.005) {
      setOverpayConfirm(values);
      return;
    }
    recordMutation.mutate(values);
  };

  const statusMutation = useMutation({
    mutationFn: (status: IPaymentPlan['status']) => updatePaymentPlanStatus(plan!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      toast.success('Plan status updated.');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  const createPlanForm = (
    <form
      onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
      className="space-y-4"
      noValidate
    >
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">Plan total</p>
        <p className="text-sm font-semibold">
          ${caseTotal.toFixed(2)}{' '}
          <span className="font-normal text-muted-foreground">— from itemized charges</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
              <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
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
      <Button type="submit" disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending ? 'Creating...' : 'Create Plan'}
      </Button>
    </form>
  );

  if (!plan) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm text-muted-foreground">No payment plan set up.</p>
            {caseTotal <= 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Add itemized charges first.
              </p>
            )}
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(v) => {
              setCreateOpen(v);
              if (!v) createForm.reset();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={caseTotal <= 0}>
                Create Payment Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Plan</DialogTitle>
              </DialogHeader>
              {createPlanForm}
            </DialogContent>
          </Dialog>
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
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Payment Plan</p>
              <p className="text-xs text-muted-foreground">
                {plan.numberOfInstallments} installments ·{' '}
                {FREQ_OPTIONS.find((o) => o.value === plan.frequencyDays)?.label ??
                  `${plan.frequencyDays}-day`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  PLAN_STATUS_STYLES[plan.status],
                )}
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
            <span>
              {paidCount} / {plan.installments.length} paid
            </span>
            <span>${Number(plan.totalAmount).toFixed(2)} total</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{
                width: `${plan.installments.length ? (paidCount / plan.installments.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2" data-testid="plan-installment-chips">
            {plan.installments.map((inst) => {
              const clickable = inst.status === 'pending' || inst.status === 'overdue';
              return (
                <button
                  key={inst.id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (!clickable) return;
                    setPayingInstallmentId(inst.id);
                    recordForm.setValue('paidAmount', inst.amount);
                  }}
                  className={cn(
                    'flex-1 min-w-[140px] text-left rounded-lg border border-border px-3 py-2',
                    clickable
                      ? 'cursor-pointer hover:border-primary transition-colors'
                      : 'cursor-default',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {inst.isDownPayment ? 'Down Payment' : `#${inst.installmentNumber}`}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                        INSTALLMENT_STATUS_STYLES[inst.status],
                      )}
                    >
                      {inst.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold">${Number(inst.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {inst.paidAt
                      ? `Paid ${formatDate(inst.paidAt)}`
                      : `Due ${formatDate(inst.dueDate)}`}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Record payment dialog */}
      <Dialog
        open={!!payingInstallmentId}
        onOpenChange={(v) => {
          if (!v) {
            setPayingInstallmentId(null);
            setOverpayConfirm(null);
            recordForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Payment — Installment #{activeInstallment?.installmentNumber}
            </DialogTitle>
          </DialogHeader>
          {overpayConfirm && activeInstallment ? (
            <div className="space-y-3">
              <p className="text-sm text-[hsl(var(--warning))]">
                ${overpayConfirm.paidAmount.toFixed(2)} exceeds this installment&apos;s amount of $
                {Number(activeInstallment.amount).toFixed(2)} by $
                {(overpayConfirm.paidAmount - Number(activeInstallment.amount)).toFixed(2)}.
                Record anyway?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOverpayConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={recordMutation.isPending}
                  onClick={() => recordMutation.mutate(overpayConfirm)}
                >
                  {recordMutation.isPending ? 'Recording...' : 'Record Anyway'}
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={recordForm.handleSubmit((v) =>
                submitInstallmentPayment(v, activeInstallment ? Number(activeInstallment.amount) : 0),
              )}
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
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CasePaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="mt-6">
        <CasePaymentsView caseId={id} />
      </div>
    </div>
  );
}
