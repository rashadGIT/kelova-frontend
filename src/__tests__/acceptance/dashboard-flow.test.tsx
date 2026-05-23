/**
 * @jest-environment jsdom
 *
 * Acceptance test: Dashboard page renders stat cards and recent cases table,
 * and clicking a case row navigates to /cases/:id.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/store/auth.store', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { role: string } | null }) => unknown) =>
    selector({ user: null }),
  ),
}));

jest.mock('@/lib/api/dashboard', () => ({
  getDashboardStats: jest.fn(),
  getRecentCases: jest.fn(),
}));

jest.mock('@/lib/api/revenue', () => ({
  getRevenueReport: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatRelative: jest.fn(() => '1 day ago'),
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { useRouter } from 'next/navigation';
import { getDashboardStats, getRecentCases } from '@/lib/api/dashboard';
import { getRevenueReport } from '@/lib/api/revenue';
import { apiClient } from '@/lib/api/client';
import DashboardPage from '@/app/(dashboard)/page';

const mockGetDashboardStats = getDashboardStats as jest.Mock;
const mockGetRecentCases = getRecentCases as jest.Mock;
const mockGetRevenueReport = getRevenueReport as jest.Mock;
const mockApiClientGet = (apiClient.get as jest.Mock);

const mockStats = {
  activeCases: 7,
  overdueTasks: 2,
  casesThisMonth: 4,
  pendingSignatures: 1,
};

const mockRecentCases = [
  {
    id: 'case-abc',
    deceasedName: 'Martha Green',
    deceasedFirstName: 'Martha',
    deceasedLastName: 'Green',
    status: 'new',
    assignedTo: null,
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'case-def',
    deceasedName: 'Robert Hill',
    deceasedFirstName: 'Robert',
    deceasedLastName: 'Hill',
    status: 'in_progress',
    assignedTo: 'Jane Staff',
    updatedAt: '2025-01-09T00:00:00Z',
  },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('Acceptance: Dashboard page', () => {
  const mockRevenue = {
    totalCases: 5,
    totalRevenue: 25000,
    averageCaseValue: 5000,
    pendingBalance: 3000,
    revenueByServiceType: [
      { serviceType: 'burial', count: 3, revenue: 15000 },
      { serviceType: 'cremation', count: 2, revenue: 10000 },
    ],
    casesByMonth: [],
  };

  const mockWorkload = [
    { id: 'user-1', name: 'Jane Director', role: 'funeral_director', activeCases: 4, overdueTaskCount: 1 },
    { id: 'user-2', name: 'Bob Staff', role: 'staff', activeCases: 2, overdueTaskCount: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDashboardStats.mockResolvedValue(mockStats);
    mockGetRecentCases.mockResolvedValue(mockRecentCases);
    mockGetRevenueReport.mockResolvedValue(mockRevenue);
    mockApiClientGet.mockResolvedValue({ data: mockWorkload });
  });

  it('renders all 4 stat card titles', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Cases')).toBeInTheDocument();
    });
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('Cases This Month')).toBeInTheDocument();
    expect(screen.getByText('Pending Signatures')).toBeInTheDocument();
  });

  it('renders stat values from mocked API data', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument(); // activeCases — unique
    });
    // Numbers 1, 2, 4 appear in both stat cards and workload table; just assert presence
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Recent Cases" section heading', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Cases')).toBeInTheDocument();
    });
  });

  it('renders recent case rows', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Martha Green')).toBeInTheDocument();
    });
    expect(screen.getByText('Robert Hill')).toBeInTheDocument();
  });

  it('navigates to /cases/:id when a case row is clicked', async () => {
    const mockPush = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    const user = userEvent.setup();
    renderWithQuery(<DashboardPage />);

    await waitFor(() => screen.getByText('Martha Green'));
    await user.click(screen.getByText('Martha Green'));

    expect(mockPush).toHaveBeenCalledWith('/cases/case-abc');
  });

  it('renders Revenue by Service Type table rows when data is available', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('burial')).toBeInTheDocument();
    });
    expect(screen.getByText('cremation')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Service Type')).toBeInTheDocument();
  });

  it('renders Total Revenue stat card with average description', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue (YTD)')).toBeInTheDocument();
    });
  });

  it('renders Staff Workload table with member names', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Director')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob Staff')).toBeInTheDocument();
    expect(screen.getByText('Staff Workload')).toBeInTheDocument();
  });

  it('shows overdue task count in red for staff with overdue tasks', async () => {
    renderWithQuery(<DashboardPage />);

    await waitFor(() => screen.getByText('Jane Director'));
    // Jane Director has overdueTaskCount=1 — find the span with destructive class
    const destructiveSpans = document.querySelectorAll('.text-destructive');
    expect(destructiveSpans.length).toBeGreaterThan(0);
    expect(destructiveSpans[0].textContent).toBe('1');
  });

  it('shows "—" for pending balance when revenue query fails', async () => {
    mockGetRevenueReport.mockRejectedValue(new Error('Network error'));
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('renders bar chart with count labels when casesByMonth has entries with count > 0', async () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    mockGetRevenueReport.mockResolvedValue({
      ...mockRevenue,
      casesByMonth: [{ month: thisMonth, count: 3, revenue: 9000 }],
    });
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "—" for avg case value when service type has count 0', async () => {
    mockGetRevenueReport.mockResolvedValue({
      ...mockRevenue,
      revenueByServiceType: [
        { serviceType: 'direct', count: 0, revenue: 0 },
      ],
    });
    renderWithQuery(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('direct')).toBeInTheDocument();
    });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Acceptance: Dashboard page — staff user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useAuthStore } = require('@/lib/store/auth.store');
    useAuthStore.mockImplementation((selector: (s: { user: { role: string } | null }) => unknown) =>
      selector({ user: { role: 'staff' } }),
    );

    const { apiClient } = require('@/lib/api/client');
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  it('renders StaffDashboard when user role is staff', async () => {
    renderWithQuery(<DashboardPage />);
    // StaffDashboard renders a "Dashboard" heading via PageHeader
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
