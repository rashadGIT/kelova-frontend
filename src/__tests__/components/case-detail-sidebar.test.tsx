/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaseDetailSidebar } from '@/components/cases/case-detail-sidebar';
import { CaseStatus, CaseStage, ServiceType } from '@/types';
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
  deceasedDob: null,
  deceasedDod: null,
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
  familyContacts: [],
  deletedAt: null,
  archivedAt: null,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('CaseDetailSidebar — Milestones', () => {
  it('shows pending state for unset milestones', () => {
    renderWithQuery(<CaseDetailSidebar caseId="case-1" initialData={baseCase} />, baseCase);
    expect(screen.getByText('Financial acknowledgment')).toBeInTheDocument();
    expect(screen.getByText('Family info submitted')).toBeInTheDocument();
    expect(screen.getByText('SS notified')).toBeInTheDocument();
  });

  it('shows completion date for set milestones', () => {
    const withMilestones: ICase = {
      ...baseCase,
      financialAckAt: '2026-06-05T18:00:00Z',
      familyInfoSubmittedAt: '2026-06-06T18:00:00Z',
      ssNotifiedAt: null,
    };
    renderWithQuery(<CaseDetailSidebar caseId="case-1" initialData={withMilestones} />, withMilestones);
    expect(screen.getByText('Jun 5, 2026')).toBeInTheDocument();
    expect(screen.getByText('Jun 6, 2026')).toBeInTheDocument();
  });
});

describe('CaseDetailSidebar — Contributors', () => {
  it('shows empty state when there is no primary contact', () => {
    renderWithQuery(<CaseDetailSidebar caseId="case-1" initialData={baseCase} />, baseCase);
    expect(screen.getByText('No contacts yet.')).toBeInTheDocument();
  });

  it('shows empty state when familyContacts is undefined', () => {
    const noContacts: ICase = { ...baseCase, familyContacts: undefined };
    renderWithQuery(<CaseDetailSidebar caseId="case-1" initialData={noContacts} />, noContacts);
    expect(screen.getByText('No contacts yet.')).toBeInTheDocument();
  });

  it('renders the primary contact details', () => {
    const withContact: ICase = {
      ...baseCase,
      familyContacts: [
        {
          id: 'fc-1',
          tenantId: 'tenant-1',
          caseId: 'case-1',
          name: 'Jane Griffin',
          relationship: 'Daughter',
          email: 'jane@example.com',
          phone: '555-0100',
          isPrimaryContact: true,
          createdAt: '2026-06-04T00:00:00Z',
          updatedAt: '2026-06-04T00:00:00Z',
        },
      ],
    };
    renderWithQuery(<CaseDetailSidebar caseId="case-1" initialData={withContact} />, withContact);
    expect(screen.getByText('Jane Griffin')).toBeInTheDocument();

    // Relationship/phone/email are only shown once the Contacts card is expanded.
    fireEvent.click(screen.getByLabelText('Expand contacts'));

    expect(screen.getByText('Daughter')).toBeInTheDocument();
    expect(screen.getByText('555-0100')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
