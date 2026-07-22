/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlockPreview } from '@/components/obituary/block-preview';
import type { ObituaryBlock } from '@/types';

jest.mock('@/lib/api/photos', () => ({
  getCasePhotos: jest.fn().mockResolvedValue([
    { id: 'doc-1', caseId: 'case-1', fileName: 'a.jpg', s3Key: 'k1', url: 'https://x/a.jpg', createdAt: '2026-01-01' },
  ]),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('BlockPreview', () => {
  it('shows an empty-state message when there are no blocks', () => {
    renderWithQuery(<BlockPreview caseId="case-1" blocks={[]} />);
    expect(screen.getByText(/will appear here/i)).toBeInTheDocument();
  });

  it('renders heading and paragraph text without a page divider for a single page', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'heading', text: 'In Memory' },
      { id: '2', type: 'paragraph', text: 'A wonderful life.' },
    ];
    renderWithQuery(<BlockPreview caseId="case-1" blocks={blocks} />);
    expect(screen.getByText('In Memory')).toBeInTheDocument();
    expect(screen.getByText('A wonderful life.')).toBeInTheDocument();
    expect(screen.queryByText(/— Page/)).not.toBeInTheDocument();
  });

  it('renders a page divider for each page when there are multiple pages', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Page one text.' },
      { id: '2', type: 'page-break' },
      { id: '3', type: 'paragraph', text: 'Page two text.' },
    ];
    renderWithQuery(<BlockPreview caseId="case-1" blocks={blocks} />);
    expect(screen.getByText('— Page 1 —')).toBeInTheDocument();
    expect(screen.getByText('— Page 2 —')).toBeInTheDocument();
  });

  it('renders an image block once its documentId resolves to a URL', async () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'image', documentId: 'doc-1', caption: 'At the lake' },
    ];
    renderWithQuery(<BlockPreview caseId="case-1" blocks={blocks} />);
    expect(await screen.findByAltText('At the lake')).toBeInTheDocument();
    expect(screen.getByText('At the lake')).toBeInTheDocument();
  });

  it('renders nothing for an image block whose documentId does not resolve', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'image', documentId: 'doc-unresolved' },
    ];
    const { container } = renderWithQuery(
      <BlockPreview caseId="case-1" blocks={blocks} />,
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
