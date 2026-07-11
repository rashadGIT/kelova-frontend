/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaseOverview } from '@/components/cases/case-overview';
import { CaseStatus, CaseStage, DispositionType, ServiceType } from '@/types';
import type { ICase } from '@/types';

jest.mock('@/lib/api/cases', () => ({
  getCaseById: jest.fn(),
}));

import { getCaseById } from '@/lib/api/cases';

const mockGetCaseById = getCaseById as jest.Mock;

function renderWithQuery(ui: React.ReactElement, data?: ICase) {
  mockGetCaseById.mockResolvedValue(data);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const baseCase: ICase = {
  id: 'case-1',
  tenantId: 'tenant-1',
  deceasedName: 'Raymond Griffin',
  deceasedDob: '1948-04-01T00:00:00Z',
  deceasedDod: '2026-06-03T00:00:00Z',
  serviceType: ServiceType.burial,
  status: CaseStatus.completed,
  stage: CaseStage.FirstCall,
  assignedToId: null,
  faithTradition: null,
  caseNumber: null,
  placeOfDeath: null,
  causeOfDeath: null,
  stateOfDeath: null,
  veteranStatus: false,
  dispositionType: null,
  arrangementDate: null,
  officiantName: null,
  maritalStatus: null,
  birthState: null,
  occupation: null,
  informantName: null,
  informantRelationship: null,
  financialAckAt: null,
  familyInfoSubmittedAt: null,
  ssNotifiedAt: null,
  deletedAt: null,
  archivedAt: null,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('CaseOverview', () => {
  it('renders always-present rows', () => {
    renderWithQuery(<CaseOverview caseId="case-1" initialData={baseCase} />, baseCase);
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Born – Died')).toBeInTheDocument();
  });

  it('omits optional rows when their fields are null', () => {
    renderWithQuery(<CaseOverview caseId="case-1" initialData={baseCase} />, baseCase);
    expect(screen.queryByText('Case Number')).not.toBeInTheDocument();
    expect(screen.queryByText('Place of Death')).not.toBeInTheDocument();
    expect(screen.queryByText('Disposition')).not.toBeInTheDocument();
    expect(screen.queryByText('Arrangement Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Officiant')).not.toBeInTheDocument();
    expect(screen.queryByText('Veteran Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Informant')).not.toBeInTheDocument();
  });

  it('renders populated optional fields', () => {
    const fullCase: ICase = {
      ...baseCase,
      caseNumber: 'SFH-2026-0042',
      placeOfDeath: 'St. Mary Hospital',
      dispositionType: DispositionType.cremation,
      arrangementDate: '2026-06-05T00:00:00Z',
      officiantName: 'Rev. Jane Doe',
      veteranStatus: true,
      informantName: 'John Griffin',
      informantRelationship: 'Son',
    };
    renderWithQuery(<CaseOverview caseId="case-1" initialData={fullCase} />, fullCase);
    expect(screen.getByText('Case Number')).toBeInTheDocument();
    expect(screen.getByText('SFH-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('Place of Death')).toBeInTheDocument();
    expect(screen.getByText('St. Mary Hospital')).toBeInTheDocument();
    expect(screen.getByText('Disposition')).toBeInTheDocument();
    expect(screen.getByText('Cremation')).toBeInTheDocument();
    expect(screen.getByText('Arrangement Date')).toBeInTheDocument();
    expect(screen.getByText('Officiant')).toBeInTheDocument();
    expect(screen.getByText('Rev. Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Veteran Status')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Informant')).toBeInTheDocument();
    expect(screen.getByText('John Griffin (Son)')).toBeInTheDocument();
  });

  it('renders informant name without relationship when relationship is missing', () => {
    const withInformant: ICase = { ...baseCase, informantName: 'John Griffin', informantRelationship: null };
    renderWithQuery(<CaseOverview caseId="case-1" initialData={withInformant} />, withInformant);
    expect(screen.getByText('John Griffin')).toBeInTheDocument();
  });

  it('omits Veteran Status row when false', () => {
    const notVeteran: ICase = { ...baseCase, veteranStatus: false };
    renderWithQuery(<CaseOverview caseId="case-1" initialData={notVeteran} />, notVeteran);
    expect(screen.queryByText('Veteran Status')).not.toBeInTheDocument();
  });
});
