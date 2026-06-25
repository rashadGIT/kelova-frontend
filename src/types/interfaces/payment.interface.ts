export interface IPayment {
  id: string;
  tenantId: string;
  caseId: string;
  totalAmount: number;
  amountPaid: number;
  method: string;
  notes: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  reconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
