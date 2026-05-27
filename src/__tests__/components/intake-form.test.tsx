/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/intake-form';

// Mock axios publicApiClient — component imports it from @/lib/api/public-client
jest.mock('@/lib/api/public-client', () => ({
  publicApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { publicApiClient } from '@/lib/api/public-client';

const mockGet = publicApiClient.get as jest.Mock;
const mockPost = publicApiClient.post as jest.Mock;

describe('IntakeForm', () => {
  const defaultProps = { tenantSlug: 'sunrise' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: { tenantName: 'Sunrise Funeral Home', tenantSlug: 'sunrise' } });
    mockPost.mockResolvedValue({ data: { caseId: 'case-new-123' } });
  });

  it('renders step 1 with deceased first name input', async () => {
    render(<IntakeForm {...defaultProps} />);
    // Wait for tenant fetch; first textbox in step 1 is the first name field
    await screen.findByRole('button', { name: /continue/i });
    expect(screen.getAllByRole('textbox')[0]).toBeInTheDocument();
  });

  it('renders the service type combobox', async () => {
    render(<IntakeForm {...defaultProps} />);
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('renders "Continue" button on step 1', async () => {
    render(<IntakeForm {...defaultProps} />);
    expect(await screen.findByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows validation error when Continue clicked with empty first name', async () => {
    const user = userEvent.setup();
    render(<IntakeForm {...defaultProps} />);

    // Wait for form to appear after tenant fetch
    await screen.findByRole('button', { name: /continue/i });
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('advances to step 2 when step 1 is filled and Continue clicked', async () => {
    const user = userEvent.setup();
    render(<IntakeForm {...defaultProps} />);

    // Wait for form to appear; textboxes[0] = first name, textboxes[1] = last name
    await screen.findByRole('button', { name: /continue/i });
    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[0], 'Alice');
    await user.type(textboxes[1], 'Smith');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/primary contact/i)).toBeInTheDocument();
    });
  });
});
