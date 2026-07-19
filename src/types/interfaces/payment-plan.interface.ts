export interface IPaymentInstallment {
  id: string;
  planId: string;
  tenantId: string;
  installmentNumber: number;
  isDownPayment: boolean;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  paidAmount: number | null;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentPlan {
  id: string;
  caseId: string;
  tenantId: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  frequencyDays: number;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  installments: IPaymentInstallment[];
  createdAt: string;
  updatedAt: string;
}
