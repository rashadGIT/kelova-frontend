/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar, MobileSidebarTrigger } from '@/components/layout/sidebar';

const mockUseCurrentUser = jest.fn(() => ({ canAccessSettings: true, isSuperAdmin: false }));
jest.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockExitTenantView = jest.fn();
const mockUseAdminStore = jest.fn(() => ({
  activeTenantId: null as string | null,
  activeTenantName: null as string | null,
  exitTenantView: mockExitTenantView,
}));
jest.mock('@/lib/store/admin.store', () => ({
  useAdminStore: () => mockUseAdminStore(),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the brand name', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByText('Kelova')).toBeInTheDocument();
  });

  it('renders all main nav links', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Price List')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders nav links as anchor elements', () => {
    renderWithQuery(<Sidebar />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(6);
  });

  it('Dashboard link has href "/"', () => {
    renderWithQuery(<Sidebar />);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');
  });

  it('Cases link has href "/cases"', () => {
    renderWithQuery(<Sidebar />);
    const casesLink = screen.getByRole('link', { name: /^cases$/i });
    expect(casesLink).toHaveAttribute('href', '/cases');
  });

  it('marks Dashboard link as active when pathname is "/"', () => {
    jest.mocked(usePathname).mockReturnValue('/');
    renderWithQuery(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toMatch(/font-semibold/);
  });

  it('marks Cases link as active when pathname starts with "/cases"', () => {
    jest.mocked(usePathname).mockReturnValue('/cases');
    renderWithQuery(<Sidebar />);

    const casesLink = screen.getByRole('link', { name: /^cases$/i });
    expect(casesLink.className).toMatch(/font-semibold/);
  });

  it('does not mark Dashboard as active when pathname is "/cases"', () => {
    jest.mocked(usePathname).mockReturnValue('/cases');
    renderWithQuery(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toMatch(/font-normal/);
  });
});

describe('MobileSidebarTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hamburger menu button', () => {
    renderWithQuery(<MobileSidebarTrigger />);
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  it('opens the mobile nav sheet when the button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<MobileSidebarTrigger />);

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));

    await screen.findByText('Kelova');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

describe('Sidebar — super_admin Mode A (admin-only nav)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({ canAccessSettings: true, isSuperAdmin: true });
    mockUseAdminStore.mockReturnValue({ activeTenantId: null, activeTenantName: null, exitTenantView: mockExitTenantView });
  });

  it('shows Funeral Homes and All Users links', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByText('Funeral Homes')).toBeInTheDocument();
    expect(screen.getByText('All Users')).toBeInTheDocument();
  });

  it('does not show regular nav items like Dashboard', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

describe('Sidebar — super_admin Mode B (tenant view)', () => {
  const mockExit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({ canAccessSettings: true, isSuperAdmin: true });
    mockUseAdminStore.mockReturnValue({
      activeTenantId: 'tenant-123' as string | null,
      activeTenantName: 'Heritage Memorial' as string | null,
      exitTenantView: mockExit,
    });
  });

  it('shows TenantViewBanner with tenant name', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByText('Heritage Memorial')).toBeInTheDocument();
    expect(screen.getByText('Exit tenant view')).toBeInTheDocument();
  });

  it('shows regular nav items in tenant view', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
  });

  it('calls exitTenantView when Exit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(<Sidebar />);
    await user.click(screen.getByText('Exit tenant view'));
    expect(mockExit).toHaveBeenCalled();
  });

  it('calls onClose when Exit is clicked inside MobileSidebarTrigger (sheet)', async () => {
    const user = userEvent.setup();
    renderWithQuery(<MobileSidebarTrigger />);

    // Open the sheet
    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));
    await screen.findByText('Exit tenant view');

    // Click Exit — this calls handleExit which calls onClose?.()
    await user.click(screen.getByText('Exit tenant view'));

    // Sheet should close: "Exit tenant view" is no longer visible
    await waitFor(() => {
      expect(screen.queryByText('Exit tenant view')).not.toBeInTheDocument();
    });
  });
});
