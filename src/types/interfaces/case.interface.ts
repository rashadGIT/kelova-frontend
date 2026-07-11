import type { ServiceType } from '../enums/service-type.enum';
import type { CaseStatus } from '../enums/case-status.enum';
import type { CaseStage } from '../enums/case-stage.enum';
import type { DispositionType } from '../enums/disposition-type.enum';
import type { MaritalStatus } from '../enums/marital-status.enum';
import type { IFamilyContact } from './family-contact.interface';

export interface ICaseTabSummary {
  tasks: { overdueCount: number; openCount: number };
  documents: { count: number };
  photos: { count: number };
  payments: { balanceDue: number | null; total: number | null };
  firstCall: { loggedAt: string | null };
  deathCertificate: { status: string | null };
  cremationAuthorization: { status: string | null };
  signatures: { pendingCount: number };
  arrangementConference: { heldAt: string | null };
  merchandise: { itemCount: number; total: number | null };
  cemeteryRecord: { location: string | null };
  memorialPage: { published: boolean | null };
  accommodationPage: { linkCount: number };
  obituary: { status: string | null };
  followUps: { scheduledCount: number };
  veteranBenefits: { completedCount: number; totalCount: number } | null;
  vendorAssignments: { count: number };
  tracking: { status: string | null };
}

export interface ICase {
  id: string;
  tenantId: string;
  deceasedName: string;
  deceasedDob: string | null;
  deceasedDod: string | null;
  serviceType: ServiceType;
  status: CaseStatus;
  stage: CaseStage;
  assignedToId: string | null;
  faithTradition: string | null;
  caseNumber: string | null;
  placeOfDeath: string | null;
  causeOfDeath: string | null;
  stateOfDeath: string | null;
  veteranStatus: boolean;
  dispositionType: DispositionType | null;
  arrangementDate: string | null;
  officiantName: string | null;
  maritalStatus: MaritalStatus | null;
  birthState: string | null;
  occupation: string | null;
  informantName: string | null;
  informantRelationship: string | null;
  financialAckAt: string | null;
  familyInfoSubmittedAt: string | null;
  ssNotifiedAt: string | null;
  familyContacts?: IFamilyContact[];
  deletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  overdueTaskCount?: number;
  tabSummary?: ICaseTabSummary;
}
