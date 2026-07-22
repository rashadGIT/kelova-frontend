/**
 * @jest-environment jsdom
 *
 * Acceptance test: CaseFollowUpsWidget — the Overview-tab grief follow-ups
 * widget (folded in from the old dedicated /follow-ups page).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatDate: jest.fn((d: string) => `formatted:${d}`),
  formatRelative: jest.fn(() => '1 day ago'),
  isOverdue: jest.fn(() => false),
}));

import { apiClient } from '@/lib/api/client';
import { CaseFollowUpsWidget } from '@/components/cases/case-followups-widget';

const mockApiGet = apiClient.get as jest.Mock;

const mockFollowUps = [
  { id: 'fu-1', templateType: 'one_week',   status: 'sent',    scheduledAt: '2025-02-01T00:00:00Z' },
  { id: 'fu-2', templateType: 'one_month',  status: 'pending', scheduledAt: '2025-03-01T00:00:00Z' },
  { id: 'fu-3', templateType: 'six_month',  status: 'pending', scheduledAt: null },
  { id: 'fu-4', templateType: 'one_year',   status: 'sent',    scheduledAt: '2026-01-01T00:00:00Z' },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Acceptance: CaseFollowUpsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Grief Follow-ups" card title', async () => {
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    expect(await screen.findByText('Grief Follow-ups')).toBeInTheDocument();
  });

  it('shows empty state when no follow-ups exist', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no follow-ups scheduled yet/i)).toBeInTheDocument();
    });
  });

  it('collapsed by default: shows only the next un-sent follow-up', async () => {
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => expect(screen.getByText('1 Month')).toBeInTheDocument());
    expect(screen.queryByText('1 Week')).not.toBeInTheDocument();
    expect(screen.queryByText('6 Months')).not.toBeInTheDocument();
    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });

  it('expands to show every follow-up when the chevron is clicked', async () => {
    const user = userEvent.setup();
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => expect(screen.getByText('1 Month')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /expand follow-ups/i }));

    expect(screen.getByText('1 Week')).toBeInTheDocument();
    expect(screen.getByText('1 Month')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('renders "Sent" status pills for sent follow-ups once expanded', async () => {
    const user = userEvent.setup();
    mockApiGet.mockResolvedValue({ data: mockFollowUps });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => screen.getByText('1 Month'));
    await user.click(screen.getByRole('button', { name: /expand follow-ups/i }));

    expect(screen.getAllByText('Sent')).toHaveLength(2);
  });

  it('renders "Pending" status pills for pending, not-yet-due follow-ups', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockApiGet.mockResolvedValue({
      data: [{ id: 'fu-future', templateType: 'one_month', status: 'pending', scheduledAt: futureDate }],
    });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => screen.getByText('1 Month'));
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders "Overdue" for a pending follow-up whose scheduled date has passed', async () => {
    mockApiGet.mockResolvedValue({
      data: [{ id: 'fu-overdue', templateType: 'one_week', status: 'pending', scheduledAt: '2020-01-01T00:00:00Z' }],
    });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => screen.getByText('1 Week'));
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows "Date TBD" when scheduledAt is null', async () => {
    mockApiGet.mockResolvedValue({ data: [mockFollowUps[2]] });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText('Date TBD')).toBeInTheDocument();
    });
  });

  it('shows the formatted date when scheduledAt is set', async () => {
    mockApiGet.mockResolvedValue({ data: [mockFollowUps[0]] });
    renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText('formatted:2025-02-01T00:00:00Z')).toBeInTheDocument();
    });
  });

  it('renders a loading skeleton while fetching', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQuery(<CaseFollowUpsWidget caseId="case-123" />);
    expect(container.querySelector('.h-16')).toBeInTheDocument();
  });
});
