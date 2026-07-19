/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlockEditor } from '@/components/obituary/block-editor';
import type { ObituaryBlock } from '@/types';

jest.mock('@/lib/api/photos', () => ({
  getCasePhotos: jest.fn().mockResolvedValue([]),
  presignPhoto: jest.fn(),
  confirmPhoto: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('BlockEditor', () => {
  it('renders existing blocks', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'heading', text: 'In Memory' },
      { id: '2', type: 'paragraph', text: 'A wonderful life.' },
    ];
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={blocks} onChange={jest.fn()} />,
    );
    expect(screen.getByDisplayValue('In Memory')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A wonderful life.')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no blocks', () => {
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={[]} onChange={jest.fn()} />,
    );
    expect(screen.getByText(/No content yet/i)).toBeInTheDocument();
  });

  it('appends a new paragraph block when "Paragraph" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /paragraph/i }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'paragraph', text: '' }),
    ]);
  });

  it('appends a new heading block when "Heading" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /heading/i }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'heading', text: '' }),
    ]);
  });

  it('appends a divider block when "Divider" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /divider/i }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'divider' }),
    ]);
  });

  it('appends a page-break block when "Page Break" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /page break/i }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'page-break' }),
    ]);
  });

  it('updates paragraph text on change', async () => {
    const user = userEvent.setup();

    function StatefulHarness() {
      const [blocks, setBlocks] = React.useState<ObituaryBlock[]>([
        { id: '1', type: 'paragraph', text: '' },
      ]);
      return <BlockEditor caseId="case-1" blocks={blocks} onChange={setBlocks} />;
    }
    renderWithQuery(<StatefulHarness />);

    await user.type(screen.getByPlaceholderText(/write a paragraph/i), 'Hi');

    expect(screen.getByDisplayValue('Hi')).toBeInTheDocument();
  });

  it('removes a block when its delete button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Keep me' },
      { id: '2', type: 'paragraph', text: 'Remove me' },
    ];
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={blocks} onChange={onChange} />,
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove block/i });
    await user.click(removeButtons[1]);

    expect(onChange).toHaveBeenCalledWith([
      { id: '1', type: 'paragraph', text: 'Keep me' },
    ]);
  });

  it('renders an upload prompt for an image block with no documentId yet', () => {
    const blocks: ObituaryBlock[] = [{ id: '1', type: 'image', documentId: '' }];
    renderWithQuery(
      <BlockEditor caseId="case-1" blocks={blocks} onChange={jest.fn()} />,
    );
    expect(screen.getByText(/click to choose a photo/i)).toBeInTheDocument();
  });
});
