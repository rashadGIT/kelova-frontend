/**
 * @jest-environment jsdom
 *
 * Acceptance test: full 3-step intake submission user flow.
 * Covers TEST-03 (acceptance tests = RTL user-flow level per CLAUDE.md).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/intake-form';

jest.mock('@/lib/api/public-client', () => ({
  publicApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { toast } from 'sonner';
import { publicApiClient } from '@/lib/api/public-client';

const mockGet = publicApiClient.get as jest.Mock;
const mockPost = publicApiClient.post as jest.Mock;

describe('Acceptance: Intake submission flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: { tenantName: 'Sunrise Funeral Home', tenantSlug: 'sunrise' } });
    mockPost.mockResolvedValue({ data: { caseId: 'case-abc-123', familyAccessToken: 'tok-abc-123', signatureTokens: [] } });
  });

  it('completes full 3-step intake form and shows success state', async () => {
    const user = userEvent.setup();
    render(<IntakeForm tenantSlug="sunrise" />);

    // --- Step 1: Deceased information ---
    // Wait for tenant fetch; textboxes[0] = first name, textboxes[1] = last name
    await screen.findByRole('button', { name: /continue/i });
    const step1Inputs = screen.getAllByRole('textbox');
    await user.type(step1Inputs[0], 'Alice');
    await user.type(step1Inputs[1], 'Smith');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // --- Step 2: Primary contact ---
    await waitFor(() => {
      expect(screen.getByText(/primary contact/i)).toBeInTheDocument();
    });

    // Step 2 has unlabeled inputs (no htmlFor) — query by placeholder or type attribute
    // contactFirstName and contactLastName render without explicit htmlFor in step 2
    const allTextboxes = screen.getAllByRole('textbox');
    // First two textboxes in step 2 are first name and last name
    await user.type(allTextboxes[0], 'Jane');
    await user.type(allTextboxes[1], 'Smith');

    // Phone input (type="tel")
    const phoneInput = screen.getByPlaceholderText(/555/i);
    await user.type(phoneInput, '5550001234');

    // Email input (type="email")
    const emailInput = screen.getByPlaceholderText(/email/i);
    await user.type(emailInput, 'jane@example.com');

    // Relationship input — use exact placeholder to avoid matching informantRelationship
    const relationshipInput = screen.getByPlaceholderText('e.g. Spouse, Child, Sibling');
    await user.type(relationshipInput, 'Spouse');

    // Informant fields are required — fill explicitly (auto-fill via watch may not fire in tests)
    await user.type(screen.getByPlaceholderText('Your full legal name'), 'Jane Smith');
    await user.type(screen.getByPlaceholderText('e.g. Son, Daughter, Spouse'), 'Spouse');

    // Authorized representative checkbox is required (z.literal(true))
    await user.click(screen.getByRole('checkbox', { name: /legally authorized/i }));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // --- Step 3: Service preferences (all optional) ---
    await waitFor(() => {
      expect(screen.getByText(/service preferences/i)).toBeInTheDocument();
    });

    // Continue to step 4 (Confirmation)
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // --- Step 4: Confirmation ---
    await waitFor(() => {
      expect(screen.getByText(/confirmation/i)).toBeInTheDocument();
    });

    // Check the required financial acknowledgment checkbox
    await user.click(screen.getByRole('checkbox'));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit information/i }));

    // --- Verify success state ---
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });

    // Verify API was called with correct endpoint and payload shape
    expect(mockPost).toHaveBeenCalledWith(
      '/intake/sunrise',
      expect.objectContaining({
        deceasedName: 'Alice Smith',
        serviceType: 'burial',
        primaryContact: expect.objectContaining({
          name: 'Jane Smith',
          email: 'jane@example.com',
          relationship: 'Spouse',
        }),
        financialResponsibilityAcknowledgment: true,
      })
    );
  });

  it('shows error toast when API call fails', async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error('Network error'));

    render(<IntakeForm tenantSlug="sunrise" />);

    // Complete steps 1 and 2 quickly — wait for tenant fetch first
    await screen.findByRole('button', { name: /continue/i });
    const step1Inputs = screen.getAllByRole('textbox');
    await user.type(step1Inputs[0], 'Bob');
    await user.type(step1Inputs[1], 'Jones');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/primary contact/i));

    const allTextboxes = screen.getAllByRole('textbox');
    await user.type(allTextboxes[0], 'Mary');
    await user.type(allTextboxes[1], 'Jones');
    await user.type(screen.getByPlaceholderText(/555/i), '5550009999');
    await user.type(screen.getByPlaceholderText(/email/i), 'mary@example.com');
    await user.type(screen.getByPlaceholderText('e.g. Spouse, Child, Sibling'), 'Child');
    await user.type(screen.getByPlaceholderText('Your full legal name'), 'Mary Jones');
    await user.type(screen.getByPlaceholderText('e.g. Son, Daughter, Spouse'), 'Child');
    await user.click(screen.getByRole('checkbox', { name: /legally authorized/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/service preferences/i));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/confirmation/i));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /submit information/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Submission failed')
      );
    });
  });
});
