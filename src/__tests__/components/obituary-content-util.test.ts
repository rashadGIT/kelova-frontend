import {
  createBlock,
  newBlockId,
  wordCountForBlocks,
  wordCountGuidance,
  serializeBlocksToPlainText,
  splitIntoPages,
  summarizeBlocks,
} from '@/components/obituary/obituary-content.util';
import type { ObituaryBlock } from '@/types';

describe('newBlockId', () => {
  it('returns unique ids on successive calls', () => {
    const a = newBlockId();
    const b = newBlockId();
    expect(a).not.toBe(b);
  });
});

describe('createBlock', () => {
  it('creates a paragraph block with empty text', () => {
    const block = createBlock('paragraph');
    expect(block).toMatchObject({ type: 'paragraph', text: '' });
    expect(block.id).toBeTruthy();
  });

  it('creates a heading block with empty text', () => {
    const block = createBlock('heading');
    expect(block).toMatchObject({ type: 'heading', text: '' });
  });

  it('creates an image block with empty documentId', () => {
    const block = createBlock('image');
    expect(block).toMatchObject({ type: 'image', documentId: '' });
  });

  it('creates a divider block', () => {
    const block = createBlock('divider');
    expect(block.type).toBe('divider');
  });

  it('creates a page-break block', () => {
    const block = createBlock('page-break');
    expect(block.type).toBe('page-break');
  });
});

describe('wordCountForBlocks', () => {
  it('counts words across heading and paragraph blocks', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'heading', text: 'In Memory' },
      { id: '2', type: 'paragraph', text: 'A life well lived and loved.' },
    ];
    expect(wordCountForBlocks(blocks)).toBe(8);
  });

  it('ignores image, divider, and page-break blocks', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Two words' },
      { id: '2', type: 'image', documentId: 'doc-1' },
      { id: '3', type: 'divider' },
      { id: '4', type: 'page-break' },
    ];
    expect(wordCountForBlocks(blocks)).toBe(2);
  });

  it('returns 0 for an empty block list', () => {
    expect(wordCountForBlocks([])).toBe(0);
  });
});

describe('wordCountGuidance', () => {
  it('flags 0 words as muted', () => {
    expect(wordCountGuidance(0)).toEqual({ text: '0 words', tone: 'muted' });
  });

  it('flags counts over 350 as a warning', () => {
    const result = wordCountGuidance(400);
    expect(result.tone).toBe('warning');
  });

  it('flags typical range (100-200) as muted', () => {
    const result = wordCountGuidance(150);
    expect(result.tone).toBe('muted');
  });
});

describe('serializeBlocksToPlainText', () => {
  it('joins heading/paragraph text and renders a divider as a rule', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'heading', text: 'Title' },
      { id: '2', type: 'paragraph', text: 'Body text.' },
      { id: '3', type: 'divider' },
      { id: '4', type: 'paragraph', text: 'More text.' },
    ];
    expect(serializeBlocksToPlainText(blocks)).toBe(
      'Title\n\nBody text.\n\n---\n\nMore text.',
    );
  });

  it('skips image and page-break blocks', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Before.' },
      { id: '2', type: 'image', documentId: 'doc-1' },
      { id: '3', type: 'page-break' },
      { id: '4', type: 'paragraph', text: 'After.' },
    ];
    expect(serializeBlocksToPlainText(blocks)).toBe('Before.\n\nAfter.');
  });
});

describe('splitIntoPages', () => {
  it('returns a single page when there are no page breaks', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'A' },
      { id: '2', type: 'paragraph', text: 'B' },
    ];
    expect(splitIntoPages(blocks)).toEqual([blocks]);
  });

  it('splits into multiple pages at page-break blocks, excluding the break itself', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Page 1' },
      { id: '2', type: 'page-break' },
      { id: '3', type: 'paragraph', text: 'Page 2' },
    ];
    const pages = splitIntoPages(blocks);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual([{ id: '1', type: 'paragraph', text: 'Page 1' }]);
    expect(pages[1]).toEqual([{ id: '3', type: 'paragraph', text: 'Page 2' }]);
  });

  it('handles a trailing page-break by producing a trailing empty page', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'paragraph', text: 'Only page' },
      { id: '2', type: 'page-break' },
    ];
    const pages = splitIntoPages(blocks);
    expect(pages).toHaveLength(2);
    expect(pages[1]).toEqual([]);
  });
});

describe('summarizeBlocks', () => {
  it('summarizes counts of each block type plus page count', () => {
    const blocks: ObituaryBlock[] = [
      { id: '1', type: 'heading', text: 'H' },
      { id: '2', type: 'paragraph', text: 'P1' },
      { id: '3', type: 'paragraph', text: 'P2' },
      { id: '4', type: 'image', documentId: 'doc-1' },
      { id: '5', type: 'page-break' },
      { id: '6', type: 'paragraph', text: 'P3' },
    ];
    expect(summarizeBlocks(blocks)).toBe('1 heading, 3 paragraphs, 1 image, 2 pages');
  });

  it('always includes a page count even with no content', () => {
    expect(summarizeBlocks([])).toBe('1 page');
  });
});
