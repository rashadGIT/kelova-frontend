export interface IObituarySubmission {
  id: string;
  obituaryId: string;
  tenantId: string;
  outlet: string;
  outletEmail: string | null;
  submittedAt: string | null;
  status: 'submitted' | 'published' | 'rejected' | 'cancelled';
  publishedUrl: string | null;
  publishedAt: string | null;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}
