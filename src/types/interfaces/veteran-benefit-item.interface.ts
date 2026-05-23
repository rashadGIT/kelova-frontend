export interface IVeteranBenefitItem {
  id: string;
  caseId: string;
  tenantId: string;
  benefitName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'waived';
  notes: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
