export interface IArrangementConference {
  id: string;
  caseId: string;
  tenantId: string;
  conductedBy: string | null;
  heldAt: string | null;
  notes: string | null;
  familyPresentNames: string | null;
  serviceTypeSelected: string | null;
  merchandiseSelected: string | null;
  totalEstimate: number | null;
  contractSigned: boolean;
  signedAt: string | null;
  followUpRequired: boolean;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
