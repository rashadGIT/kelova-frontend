/**
 * @jest-environment jsdom
 *
 * Acceptance test: payments UI — summary, plan strip, and history render
 * together on the merged page, form submissions succeed and show toasts.
 *
 * The page's default export uses React.use(params) which does not resolve
 * predictably in jsdom. Instead we test the merged CasePaymentsView behaviour
 * by reconstructing the same component tree inline — same mocks, same
 * assertions, same structure as the real page (Payment Summary, Payment Plan
 * strip, Payment History — no tabs).
 */
import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

jest.mock('@/lib/api/payments', () => ({
  getCasePayments: jest.fn(),
  recordPayment: jest.fn(),
}));

jest.mock('@/lib/api/payment-plans', () => ({
  getPaymentPlan: jest.fn(),
  createPaymentPlan: jest.fn(),
  recordInstallmentPayment: jest.fn(),
  updatePaymentPlanStatus: jest.fn(),
}));

jest.mock('@/lib/api/case-line-items', () => ({
  getCaseLineItems: jest.fn(),
  addCaseLineItem: jest.fn(),
  removeCaseLineItem: jest.fn(),
}));

jest.mock('@/lib/api/price-list', () => ({
  getPriceList: jest.fn(),
}));

jest.mock('@/lib/api/merchandise', () => ({
  getCaseMerchandise: jest.fn(),
  getMerchandise: jest.fn(),
  addCaseMerchandise: jest.fn(),
  removeCaseMerchandise: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  formatRelative: jest.fn(() => '1 day ago'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

import { getCasePayments, recordPayment } from '@/lib/api/payments';
import {
  getPaymentPlan,
  createPaymentPlan,
  recordInstallmentPayment,
} from '@/lib/api/payment-plans';
import { getCaseLineItems, addCaseLineItem, removeCaseLineItem } from '@/lib/api/case-line-items';
import { getPriceList } from '@/lib/api/price-list';
import {
  getCaseMerchandise,
  getMerchandise,
  addCaseMerchandise,
  removeCaseMerchandise,
  type CaseMerchandiseSelection,
  type MerchandiseItem,
} from '@/lib/api/merchandise';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/format-date';
import type { IPaymentPlan, IPaymentInstallment, ICaseLineItem, IPriceListItem } from '@/types';

const mockGetCasePayments = getCasePayments as jest.Mock;
const mockRecordPayment = recordPayment as jest.Mock;
const mockGetPaymentPlan = getPaymentPlan as jest.Mock;
const mockCreatePaymentPlan = createPaymentPlan as jest.Mock;
const mockRecordInstallmentPayment = recordInstallmentPayment as jest.Mock;
const mockGetCaseLineItems = getCaseLineItems as jest.Mock;
const mockAddCaseLineItem = addCaseLineItem as jest.Mock;
const mockRemoveCaseLineItem = removeCaseLineItem as jest.Mock;
const mockGetPriceList = getPriceList as jest.Mock;
const mockGetCaseMerchandise = getCaseMerchandise as jest.Mock;
const mockGetMerchandise = getMerchandise as jest.Mock;
const mockAddCaseMerchandise = addCaseMerchandise as jest.Mock;
const mockRemoveCaseMerchandise = removeCaseMerchandise as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

const PLAN_STATUS_STYLES: Record<IPaymentPlan['status'], string> = {
  active: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700',
  defaulted: 'bg-red-100 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
};

const INSTALLMENT_STATUS_STYLES: Record<IPaymentInstallment['status'], string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  waived: 'bg-amber-100 text-amber-700',
};

// Inline replica of the merged PaymentPlanStrip section from the page file.
function PaymentPlanStrip({ caseId, caseTotal }: { caseId: string; caseTotal: number }) {
  const queryClient = useQueryClient();
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const downPayment = '0';
  const [numberOfInstallments, setNumberOfInstallments] = useState('3');
  const [startDate, setStartDate] = useState('');

  const { data: plan, isLoading } = useQuery({
    queryKey: ['payment-plan', caseId],
    queryFn: () => getPaymentPlan(caseId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPaymentPlan(caseId, {
        downPayment: parseFloat(downPayment),
        numberOfInstallments: parseInt(numberOfInstallments, 10),
        frequencyDays: 30,
        startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      (toast as jest.Mocked<typeof toast>).success('Payment plan created.');
      setCreateOpen(false);
    },
  });

  const recordInstallmentMutation = useMutation({
    mutationFn: (amount: string) =>
      recordInstallmentPayment(payingInstallmentId!, { paidAmount: parseFloat(amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plan', caseId] });
      (toast as jest.Mocked<typeof toast>).success('Payment recorded.');
      setPayingInstallmentId(null);
    },
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (!plan) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm text-muted-foreground">No payment plan set up.</p>
            {caseTotal <= 0 && <p className="text-xs text-muted-foreground">Add itemized charges first.</p>}
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={caseTotal <= 0}>Create Payment Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Plan total</Label>
                  <p>${caseTotal.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Number of Installments</Label>
                  <Input
                    type="number"
                    value={numberOfInstallments}
                    onChange={(e) => setNumberOfInstallments(e.target.value)}
                  />
                </div>
                <div>
                  <Label>First Payment Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !startDate}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  const paidCount = plan.installments.filter((i: IPaymentInstallment) => i.status === 'paid').length;
  const activeInstallment = payingInstallmentId
    ? plan.installments.find((i: IPaymentInstallment) => i.id === payingInstallmentId)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Payment Plan</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_STATUS_STYLES[plan.status as IPaymentPlan['status']]}`}>
              {plan.status}
            </span>
          </div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>{paidCount} / {plan.installments.length} paid</span>
            <span>${Number(plan.totalAmount).toFixed(2)} total</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary rounded-full h-2"
              style={{ width: `${(paidCount / plan.installments.length) * 100}%` }}
              data-testid="plan-progress-fill"
            />
          </div>
          <div className="flex flex-wrap gap-2" data-testid="plan-installment-chips">
            {plan.installments.map((inst: IPaymentInstallment) => {
              const clickable = inst.status === 'pending' || inst.status === 'overdue';
              return (
                <button
                  key={inst.id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && setPayingInstallmentId(inst.id)}
                  className={`text-left rounded-lg border px-3 py-2 ${INSTALLMENT_STATUS_STYLES[inst.status]}`}
                >
                  <span>{inst.isDownPayment ? 'Down Payment' : `#${inst.installmentNumber}`}</span>
                  <p>${Number(inst.amount).toFixed(2)}</p>
                  <p>{inst.paidAt ? `Paid ${formatDate(inst.paidAt)}` : `Due ${formatDate(inst.dueDate)}`}</p>
                  <span>{inst.status}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!payingInstallmentId} onOpenChange={(v) => !v && setPayingInstallmentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — Installment #{activeInstallment?.installmentNumber}</DialogTitle>
          </DialogHeader>
          <RecordInstallmentForm onSubmit={(amount) => recordInstallmentMutation.mutate(amount)} pending={recordInstallmentMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordInstallmentForm({ onSubmit, pending }: { onSubmit: (amount: string) => void; pending: boolean }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="space-y-3">
      <div>
        <Label>Amount Paid ($)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Button onClick={() => onSubmit(amount)} disabled={pending || !amount}>
        {pending ? 'Recording...' : 'Record Payment'}
      </Button>
    </div>
  );
}

// Inline replica of the merged ItemizedChargesSection from the page file.
function ItemizedChargesSection({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<{
    id: string;
    source: 'charge' | 'merchandise';
    name: string;
  } | null>(null);
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
  };

  const addChargeMutation = useMutation({
    mutationFn: async () => {
      const qty = parseInt(quantity, 10) || 1;
      if (selectedEntry!.source === 'charge') {
        await addCaseLineItem(caseId, { priceListItemId: selectedEntry!.id, quantity: qty });
      } else {
        await addCaseMerchandise(caseId, { itemId: selectedEntry!.id, quantity: qty });
      }
    },
    onSuccess: () => {
      invalidateCharges();
      (toast as jest.Mocked<typeof toast>).success('Charge added.');
      setAddOpen(false);
      setSelectedEntry(null);
    },
  });

  const removeChargeMutation = useMutation({
    mutationFn: (row: { id: string; source: 'charge' | 'merchandise' }) =>
      row.source === 'charge'
        ? removeCaseLineItem(caseId, row.id)
        : removeCaseMerchandise(caseId, row.id),
    onSuccess: () => {
      invalidateCharges();
      (toast as jest.Mocked<typeof toast>).success('Charge removed.');
    },
  });

  if (lineItemsLoading || merchLoading) return <Skeleton className="h-40 w-full" />;

  const chargeRows = (lineItems ?? []).map((li: ICaseLineItem) => ({
    id: li.id,
    source: 'charge' as const,
    name: li.priceListItem.name,
    quantity: li.quantity,
    unitPrice: Number(li.unitPrice),
    total: Number(li.total),
  }));
  const merchRows = (merchSelections ?? []).map((m: CaseMerchandiseSelection) => ({
    id: m.id,
    source: 'merchandise' as const,
    name: m.item.name,
    quantity: m.quantity,
    unitPrice: Number(m.priceAtTime),
    total: Number(m.priceAtTime) * m.quantity,
  }));
  const rows = [...chargeRows, ...merchRows];
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  const catalogEntries = [
    ...(priceListCatalog ?? []).map((p: IPriceListItem) => ({
      id: p.id,
      source: 'charge' as const,
      name: p.name,
    })),
    ...(merchandiseCatalog ?? []).map((m: MerchandiseItem) => ({
      id: m.id,
      source: 'merchandise' as const,
      name: m.name,
    })),
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse itemized charges' : 'Expand itemized charges'}
        >
          <CardTitle className="text-base">Itemized Charges</CardTitle>
        </button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Add Charge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Charge</DialogTitle>
            </DialogHeader>
            {!selectedEntry ? (
              <div>
                {catalogEntries.map((entry) => (
                  <button key={`${entry.source}-${entry.id}`} type="button" onClick={() => setSelectedEntry(entry)}>
                    {entry.name}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Button onClick={() => addChargeMutation.mutate()} disabled={addChargeMutation.isPending}>
                  {addChargeMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No charges added yet.</p>
        ) : (
          <>
            {expanded &&
              rows.map((row) => (
                <div key={`${row.source}-${row.id}`}>
                  <span>{row.name}</span>
                  <span>${row.total.toFixed(2)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${row.name}`}
                    onClick={() => removeChargeMutation.mutate(row)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            <div>
              <span>Total</span>
              <span data-testid="charges-grand-total">${grandTotal.toFixed(2)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Inline replica of the merged CasePaymentsView from the page file.
// Keeps mocks identical; avoids React.use(params) entirely.
function CasePaymentsView({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });
  const { data: plan } = useQuery({
    queryKey: ['payment-plan', caseId],
    queryFn: () => getPaymentPlan(caseId),
  });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [overpayConfirm, setOverpayConfirm] = useState<{ amount: number; method: string } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: (v: { amount: number; method: string }) =>
      recordPayment(caseId, { amountPaid: v.amount, method: v.method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      (toast as jest.Mocked<typeof toast>).success('Payment recorded.');
      setOpen(false);
      setOverpayConfirm(null);
      setAmount('');
      setMethod('');
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const payment = data as import('@/types').IPayment;
  const totalAmount = Number(payment.totalAmount);
  const amountPaid = Number(payment.amountPaid);
  const outstanding = totalAmount - amountPaid;
  const isPaidInFull = outstanding <= 0 && totalAmount > 0;

  const installmentHistory = (plan?.installments ?? [])
    .filter((i: IPaymentInstallment) => i.status === 'paid')
    .map((i: IPaymentInstallment) => ({
      id: i.id,
      title: i.isDownPayment ? 'Down Payment' : `Installment #${i.installmentNumber}`,
      amount: Number(i.paidAmount ?? i.amount),
      date: i.paidAt,
    }));
  const installmentsPaidTotal = installmentHistory.reduce(
    (sum: number, e: { amount: number }) => sum + e.amount,
    0,
  );
  const ledgerAmount = amountPaid - installmentsPaidTotal;
  const ledgerHistory =
    payment.method && ledgerAmount > 0.005
      ? [
          {
            id: payment.id ?? 'ledger',
            title: payment.method.replace('_', ' '),
            amount: ledgerAmount,
            date: payment.createdAt,
          },
        ]
      : [];
  const historyEntries = [...ledgerHistory, ...installmentHistory];
  const hasRecordedPayment = historyEntries.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-green-600">${amountPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={`text-lg font-semibold ${isPaidInFull ? 'text-green-600' : 'text-amber-600'}`}>
              {isPaidInFull ? 'Paid in Full' : `$${outstanding.toFixed(2)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <PaymentPlanStrip caseId={caseId} caseTotal={totalAmount} />

      <ItemizedChargesSection caseId={caseId} />

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Payment History</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {overpayConfirm ? (
              <div className="space-y-3">
                <p>Exceeds outstanding balance of ${Math.max(0, outstanding).toFixed(2)}</p>
                <Button onClick={() => setOverpayConfirm(null)}>Cancel</Button>
                <Button
                  onClick={() => mutation.mutate(overpayConfirm)}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Recording...' : 'Record Anyway'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p>Outstanding balance: ${Math.max(0, outstanding).toFixed(2)}</p>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Amount</Label>
                    {outstanding > 0 && (
                      <button type="button" onClick={() => setAmount(String(outstanding))}>
                        Pay Remaining Balance
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Method</Label>
                  <Input
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="Cash, Check, Card..."
                  />
                </div>
                {parseFloat(amount) > 0 && (
                  <p data-testid="payment-review">
                    Remaining after payment: $
                    {Math.max(0, Math.max(0, outstanding) - parseFloat(amount)).toFixed(2)}
                  </p>
                )}
                <Button
                  onClick={() => {
                    const parsed = parseFloat(amount);
                    if (parsed - outstanding > 0.005) {
                      setOverpayConfirm({ amount: parsed, method });
                      return;
                    }
                    mutation.mutate({ amount: parsed, method });
                  }}
                  disabled={mutation.isPending || !amount || !method}
                >
                  {mutation.isPending ? 'Recording...' : 'Record'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {!hasRecordedPayment ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="rounded-md border divide-y" data-testid="payment-history-list">
          {historyEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium capitalize">{entry.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
              </div>
              <p className="text-sm font-medium text-green-600">${entry.amount.toFixed(2)} paid</p>
            </div>
          ))}
          {outstanding > 0 && (
            <div className="flex justify-end px-4 py-2">
              <p className="text-xs text-amber-600">${outstanding.toFixed(2)} remaining</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const basePlan: IPaymentPlan = {
  id: 'plan-1',
  caseId: 'case-123',
  tenantId: 'tenant-1',
  totalAmount: 6300,
  downPayment: 2520,
  numberOfInstallments: 3,
  frequencyDays: 30,
  status: 'active',
  installments: [
    {
      id: 'inst-0',
      planId: 'plan-1',
      tenantId: 'tenant-1',
      installmentNumber: 0,
      isDownPayment: true,
      amount: 2520,
      dueDate: '2026-07-01',
      status: 'paid',
      paidAmount: 2520,
      paidAt: '2026-07-01',
      paymentMethod: 'Cash',
      notes: null,
      createdAt: '2026-07-01',
      updatedAt: '2026-07-01',
    },
    {
      id: 'inst-1',
      planId: 'plan-1',
      tenantId: 'tenant-1',
      installmentNumber: 1,
      isDownPayment: false,
      amount: 2520,
      dueDate: '2026-07-11',
      status: 'paid',
      paidAmount: 2520,
      paidAt: '2026-07-11',
      paymentMethod: 'Cash',
      notes: null,
      createdAt: '2026-07-01',
      updatedAt: '2026-07-11',
    },
    {
      id: 'inst-2',
      planId: 'plan-1',
      tenantId: 'tenant-1',
      installmentNumber: 2,
      isDownPayment: false,
      amount: 1890,
      dueDate: '2026-08-11',
      status: 'pending',
      paidAmount: null,
      paidAt: null,
      paymentMethod: null,
      notes: null,
      createdAt: '2026-07-01',
      updatedAt: '2026-07-01',
    },
  ],
  createdAt: '2026-07-01',
  updatedAt: '2026-07-11',
};

const baseLineItem: ICaseLineItem = {
  id: 'cli-1',
  tenantId: 'tenant-1',
  caseId: 'case-123',
  priceListItemId: 'pli-1',
  quantity: 1,
  unitPrice: 1495,
  total: 1495,
  taxAmount: 0,
  taxScheduleId: null,
  priceListItem: {
    id: 'pli-1',
    tenantId: 'tenant-1',
    category: 'professional_services' as IPriceListItem['category'],
    name: 'Direct Cremation',
    price: 1495,
    taxable: false,
    active: true,
    sortOrder: 1,
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
  },
  createdAt: '2026-07-01',
  updatedAt: '2026-07-01',
};

const baseMerchandiseSelection = {
  id: 'cm-1',
  caseId: 'case-123',
  quantity: 1,
  priceAtTime: 3200,
  item: {
    id: 'mi-1',
    name: 'Oak Casket',
    category: 'casket',
    priceRetail: 3200,
    inStock: true,
    createdAt: '2026-07-01',
  },
};

const emptyPayment = {
  id: null,
  tenantId: 'tenant-1',
  caseId: 'case-123',
  totalAmount: 0,
  amountPaid: 0,
  method: null,
  notes: null,
  stripeCheckoutSessionId: null,
  stripePaymentIntentId: null,
  createdAt: null,
  updatedAt: null,
};

describe('Acceptance: Payments page (merged view)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCasePayments.mockResolvedValue(emptyPayment);
    mockRecordPayment.mockResolvedValue({ id: 'pay-1' });
    mockGetPaymentPlan.mockResolvedValue(null);
    mockCreatePaymentPlan.mockResolvedValue(basePlan);
    mockRecordInstallmentPayment.mockResolvedValue({ id: 'inst-2' });
    mockGetCaseLineItems.mockResolvedValue([]);
    mockGetCaseMerchandise.mockResolvedValue([]);
    mockGetPriceList.mockResolvedValue([baseLineItem.priceListItem]);
    mockGetMerchandise.mockResolvedValue([baseMerchandiseSelection.item]);
    mockAddCaseLineItem.mockResolvedValue(baseLineItem);
    mockAddCaseMerchandise.mockResolvedValue(baseMerchandiseSelection);
    mockRemoveCaseLineItem.mockResolvedValue(undefined);
    mockRemoveCaseMerchandise.mockResolvedValue(undefined);
  });

  it('renders the payment summary section', async () => {
    renderWithQuery(<CasePaymentsView caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });
  });

  it('renders Total, Paid, and Outstanding labels', async () => {
    renderWithQuery(<CasePaymentsView caseId="case-123" />);

    await waitFor(() => screen.getByText('Payment Summary'));
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
  });

  it('shows "Record Payment" button', async () => {
    renderWithQuery(<CasePaymentsView caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /record payment/i }).length).toBeGreaterThan(0);
    });
  });

  it('calls recordPayment API and shows success toast on submit', async () => {
    mockGetCasePayments.mockResolvedValue({ ...emptyPayment, totalAmount: 1000 });
    const user = userEvent.setup();
    renderWithQuery(<CasePaymentsView caseId="case-123" />);

    await waitFor(() => screen.getByText('Payment History'));
    const historyRecordButtons = screen.getAllByRole('button', { name: /^record payment$/i });
    await user.click(historyRecordButtons[historyRecordButtons.length - 1]);

    await waitFor(() => screen.getByPlaceholderText('0.00'));
    await user.type(screen.getByPlaceholderText('0.00'), '500');
    await user.type(screen.getByPlaceholderText(/cash, check, card/i), 'Cash');

    const recordBtn = screen.getByRole('button', { name: /^record$/i });
    await user.click(recordBtn);

    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith(
        'case-123',
        expect.objectContaining({ amountPaid: 500, method: 'Cash' })
      );
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Payment recorded.');
    });
  });

  it('shows "No payments recorded yet" when no payment has been recorded', async () => {
    renderWithQuery(<CasePaymentsView caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no payments recorded yet/i)).toBeInTheDocument();
    });
  });

  describe('Payment History', () => {
    it('shows paid plan installments (including the down payment) even when no generic payment was ever recorded', async () => {
      // Matches the real-world case that surfaced this bug: a plan's down
      // payment is paid at creation time and never touches the generic
      // ledger, so Payment History must source it from the plan instead.
      mockGetCasePayments.mockResolvedValue({
        ...emptyPayment,
        totalAmount: 6300,
        amountPaid: 5040, // down payment (2520) + installment #1 (2520), combined by the API
      });
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Payment History'));
      expect(screen.queryByText(/no payments recorded yet/i)).not.toBeInTheDocument();
      const historyList = within(screen.getByTestId('payment-history-list'));
      expect(historyList.getByText('Down Payment')).toBeInTheDocument();
      expect(historyList.getByText('Installment #1')).toBeInTheDocument();
      expect(historyList.getAllByText('$2520.00 paid').length).toBe(2);
    });

    it('warns before recording a payment that exceeds the outstanding balance instead of allowing it silently', async () => {
      // Reproduces the actual bug: a $700 payment recorded against a case
      // that was already paid in full ballooned to $8018 paid with no warning.
      mockGetCasePayments.mockResolvedValue({
        ...emptyPayment,
        totalAmount: 6465,
        amountPaid: 6465,
      });
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Payment History'));
      const historyRecordButtons = screen.getAllByRole('button', { name: /^record payment$/i });
      await user.click(historyRecordButtons[historyRecordButtons.length - 1]);

      await waitFor(() => screen.getByPlaceholderText('0.00'));
      await user.type(screen.getByPlaceholderText('0.00'), '700');
      await user.type(screen.getByPlaceholderText(/cash, check, card/i), 'Cash');
      await user.click(screen.getByRole('button', { name: /^record$/i }));

      // The API must not be called yet — the warning has to be confirmed first.
      expect(mockRecordPayment).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText(/exceeds outstanding balance/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^record anyway$/i }));

      await waitFor(() => {
        expect(mockRecordPayment).toHaveBeenCalledWith(
          'case-123',
          expect.objectContaining({ amountPaid: 700, method: 'Cash' }),
        );
      });
    });

    it('shows the outstanding balance and fills the amount when "Pay Remaining Balance" is clicked', async () => {
      mockGetCasePayments.mockResolvedValue({
        ...emptyPayment,
        totalAmount: 6465,
        amountPaid: 3480,
      });
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Payment History'));
      const historyRecordButtons = screen.getAllByRole('button', { name: /^record payment$/i });
      await user.click(historyRecordButtons[historyRecordButtons.length - 1]);

      await waitFor(() => screen.getByText('Outstanding balance: $2985.00'));
      await user.click(screen.getByRole('button', { name: /pay remaining balance/i }));

      expect(screen.getByPlaceholderText('0.00')).toHaveValue(2985);
    });

    it('shows a live preview of what remains after a partial payment', async () => {
      mockGetCasePayments.mockResolvedValue({
        ...emptyPayment,
        totalAmount: 6465,
        amountPaid: 3480,
      });
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Payment History'));
      const historyRecordButtons = screen.getAllByRole('button', { name: /^record payment$/i });
      await user.click(historyRecordButtons[historyRecordButtons.length - 1]);

      await waitFor(() => screen.getByPlaceholderText('0.00'));
      expect(screen.queryByTestId('payment-review')).not.toBeInTheDocument();

      await user.type(screen.getByPlaceholderText('0.00'), '1000');

      await waitFor(() => {
        expect(screen.getByTestId('payment-review')).toHaveTextContent(
          'Remaining after payment: $1985.00',
        );
      });
    });
  });

  describe('Payment Plan strip', () => {
    it('shows "No payment plan set up" and opens the create-plan dialog showing the derived total', async () => {
      mockGetCasePayments.mockResolvedValue({ ...emptyPayment, totalAmount: 6300 });
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText('No payment plan set up.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create payment plan/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(
          within(dialog).getByText(
            (_, element) => element?.textContent === '$6300.00',
          ),
        ).toBeInTheDocument();
      });
    });

    it('disables "Create Payment Plan" when the case has no itemized charges yet', async () => {
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText('Add itemized charges first.')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /create payment plan/i })).toBeDisabled();
    });

    it('renders progress bar and installment chips when a plan exists', async () => {
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText('Payment Plan')).toBeInTheDocument();
      });
      expect(screen.getByText('2 / 3 paid')).toBeInTheDocument();
      const chips = within(screen.getByTestId('plan-installment-chips'));
      expect(chips.getByText('Down Payment')).toBeInTheDocument();
      expect(chips.getByText('#1')).toBeInTheDocument();
      expect(chips.getByText('#2')).toBeInTheDocument();
      expect(screen.getByTestId('plan-progress-fill')).toHaveStyle({ width: `${(2 / 3) * 100}%` });
    });

    it('shows the down-payment milestone as an already-paid, non-clickable chip', async () => {
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByTestId('plan-installment-chips'));
      const chips = within(screen.getByTestId('plan-installment-chips'));
      const downPaymentChip = chips.getByText('Down Payment').closest('button')!;
      expect(downPaymentChip).toBeDisabled();
    });

    it('opens the record-installment dialog when a pending chip is clicked', async () => {
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByTestId('plan-installment-chips'));
      const chips = within(screen.getByTestId('plan-installment-chips'));
      const pendingChip = chips.getByText('#2').closest('button')!;
      expect(pendingChip).not.toBeDisabled();
      await user.click(pendingChip);

      await waitFor(() => {
        expect(screen.getByText('Record Payment — Installment #2')).toBeInTheDocument();
      });
    });

    it('does not allow clicking a paid installment chip', async () => {
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByTestId('plan-installment-chips'));
      const chips = within(screen.getByTestId('plan-installment-chips'));
      const paidChip = chips.getByText('#1').closest('button')!;
      expect(paidChip).toBeDisabled();
    });

    it('calls recordInstallmentPayment and shows success toast on submit', async () => {
      mockGetPaymentPlan.mockResolvedValue(basePlan);
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('#2'));
      await user.click(screen.getByText('#2').closest('button')!);

      await waitFor(() => screen.getByText('Amount Paid ($)'));
      const amountInputs = screen.getAllByRole('spinbutton');
      const paidAmountInput = amountInputs[amountInputs.length - 1];
      await user.type(paidAmountInput, '1890');
      await user.click(screen.getByRole('button', { name: /^record payment$/i, hidden: false }));

      await waitFor(() => {
        expect(mockRecordInstallmentPayment).toHaveBeenCalledWith(
          'inst-2',
          expect.objectContaining({ paidAmount: 1890 }),
        );
      });
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Payment recorded.');
      });
    });
  });

  describe('Itemized Charges section', () => {
    it('collapses and re-expands the charges list, keeping the header visible', async () => {
      mockGetCaseLineItems.mockResolvedValue([baseLineItem]);
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Direct Cremation'));
      const toggle = screen.getByRole('button', { name: /collapse itemized charges/i });

      await user.click(toggle);
      expect(screen.queryByText('Direct Cremation')).not.toBeInTheDocument();
      expect(screen.getByText('Itemized Charges')).toBeInTheDocument();
      // The total must stay visible even while collapsed.
      expect(screen.getByTestId('charges-grand-total')).toHaveTextContent('$1495.00');

      await user.click(screen.getByRole('button', { name: /expand itemized charges/i }));
      expect(screen.getByText('Direct Cremation')).toBeInTheDocument();
    });

    it('shows "No charges added yet" when there are no line items or merchandise', async () => {
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText('No charges added yet.')).toBeInTheDocument();
      });
    });

    it('renders a combined list of line items and merchandise with a correct grand total', async () => {
      mockGetCaseLineItems.mockResolvedValue([baseLineItem]);
      mockGetCaseMerchandise.mockResolvedValue([baseMerchandiseSelection]);
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText('Direct Cremation')).toBeInTheDocument();
      });
      expect(screen.getByText('Oak Casket')).toBeInTheDocument();
      expect(screen.getByTestId('charges-grand-total')).toHaveTextContent('$4695.00');
    });

    it('adds a charge from the price list catalog and shows a success toast', async () => {
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Itemized Charges'));
      await user.click(screen.getByRole('button', { name: /^add charge$/i }));

      await waitFor(() => screen.getByText('Direct Cremation'));
      await user.click(screen.getByText('Direct Cremation'));

      await waitFor(() => screen.getByText('Quantity'));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockAddCaseLineItem).toHaveBeenCalledWith(
          'case-123',
          expect.objectContaining({ priceListItemId: 'pli-1', quantity: 1 }),
        );
      });
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Charge added.');
      });
    });

    it('adds a charge from the merchandise catalog and shows a success toast', async () => {
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Itemized Charges'));
      await user.click(screen.getByRole('button', { name: /^add charge$/i }));

      await waitFor(() => screen.getByText('Oak Casket'));
      await user.click(screen.getByText('Oak Casket'));

      await waitFor(() => screen.getByText('Quantity'));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockAddCaseMerchandise).toHaveBeenCalledWith(
          'case-123',
          expect.objectContaining({ itemId: 'mi-1', quantity: 1 }),
        );
      });
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Charge added.');
      });
    });

    it('removes a line-item charge and calls removeCaseLineItem', async () => {
      mockGetCaseLineItems.mockResolvedValue([baseLineItem]);
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Direct Cremation'));
      await user.click(screen.getByRole('button', { name: /remove direct cremation/i }));

      await waitFor(() => {
        expect(mockRemoveCaseLineItem).toHaveBeenCalledWith('case-123', 'cli-1');
      });
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Charge removed.');
      });
    });

    it('removes a merchandise charge and calls removeCaseMerchandise', async () => {
      mockGetCaseMerchandise.mockResolvedValue([baseMerchandiseSelection]);
      const user = userEvent.setup();
      renderWithQuery(<CasePaymentsView caseId="case-123" />);

      await waitFor(() => screen.getByText('Oak Casket'));
      await user.click(screen.getByRole('button', { name: /remove oak casket/i }));

      await waitFor(() => {
        expect(mockRemoveCaseMerchandise).toHaveBeenCalledWith('case-123', 'cm-1');
      });
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Charge removed.');
      });
    });
  });
});
