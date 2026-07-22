/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImagePickerDialog } from '@/components/obituary/image-picker-dialog';

jest.mock('@/lib/api/photos', () => ({
  getCasePhotos: jest.fn(),
  presignPhoto: jest.fn(),
  confirmPhoto: jest.fn(),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { getCasePhotos, presignPhoto, confirmPhoto } from '@/lib/api/photos';
import axios from 'axios';

const mockGetCasePhotos = getCasePhotos as jest.Mock;
const mockPresignPhoto = presignPhoto as jest.Mock;
const mockConfirmPhoto = confirmPhoto as jest.Mock;
const mockAxiosPut = axios.put as jest.Mock;

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ImagePickerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCasePhotos.mockResolvedValue([
      { id: 'doc-1', caseId: 'case-1', fileName: 'a.jpg', s3Key: 'k1', url: 'https://x/a.jpg', createdAt: '2026-01-01' },
      { id: 'doc-2', caseId: 'case-1', fileName: 'b.jpg', s3Key: 'k2', url: 'https://x/b.jpg', createdAt: '2026-01-02' },
    ]);
  });

  it('shows a message when there are no photos yet', async () => {
    mockGetCasePhotos.mockResolvedValue([]);
    renderWithQuery(
      <ImagePickerDialog caseId="case-1" open onOpenChange={jest.fn()} onSelect={jest.fn()} />,
    );
    expect(await screen.findByText(/no photos on this case yet/i)).toBeInTheDocument();
  });

  it('renders existing photo thumbnails', async () => {
    renderWithQuery(
      <ImagePickerDialog caseId="case-1" open onOpenChange={jest.fn()} onSelect={jest.fn()} />,
    );
    expect(await screen.findByAltText('a.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('b.jpg')).toBeInTheDocument();
  });

  it('calls onSelect and closes the dialog when a photo is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onOpenChange = jest.fn();
    renderWithQuery(
      <ImagePickerDialog caseId="case-1" open onOpenChange={onOpenChange} onSelect={onSelect} />,
    );

    const thumb = await screen.findByAltText('a.jpg');
    await user.click(thumb);

    expect(onSelect).toHaveBeenCalledWith('doc-1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uploads a new file via presign -> PUT -> confirm and selects it', async () => {
    mockPresignPhoto.mockResolvedValue({
      uploadUrl: 'https://upload.example/put',
      photoId: 'doc-new',
      s3Key: 'k-new',
    });
    mockAxiosPut.mockResolvedValue({});
    mockConfirmPhoto.mockResolvedValue(undefined);
    const onSelect = jest.fn();
    const onOpenChange = jest.fn();

    renderWithQuery(
      <ImagePickerDialog caseId="case-1" open onOpenChange={onOpenChange} onSelect={onSelect} />,
    );

    const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockPresignPhoto).toHaveBeenCalledWith('case-1', 'new.jpg', 'image/jpeg');
    });
    await waitFor(() => {
      expect(mockConfirmPhoto).toHaveBeenCalledWith('case-1', 'doc-new');
    });
    expect(onSelect).toHaveBeenCalledWith('doc-new');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an error toast and does not select on upload failure', async () => {
    const { toast } = await import('sonner');
    mockPresignPhoto.mockRejectedValue(new Error('network error'));
    const onSelect = jest.fn();

    renderWithQuery(
      <ImagePickerDialog caseId="case-1" open onOpenChange={jest.fn()} onSelect={onSelect} />,
    );

    const file = new File(['x'], 'bad.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upload bad.jpg');
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
