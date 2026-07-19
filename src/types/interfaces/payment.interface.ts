export interface IPayment {
  id: string | null;
  tenantId: string;
  caseId: string;
  /** Derived server-side from itemized charges — not a stored, manually-entered value. */
  totalAmount: number;
  amountPaid: number;
  method: string | null;
  notes: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
