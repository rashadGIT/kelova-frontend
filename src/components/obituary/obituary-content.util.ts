import type { ObituaryBlock } from '@/types';

let counter = 0;
export function newBlockId(): string {
  counter += 1;
  return `blk-${Date.now()}-${counter}`;
}

export function createBlock(type: ObituaryBlock['type']): ObituaryBlock {
  const id = newBlockId();
  switch (type) {
    case 'heading':
      return { id, type: 'heading', text: '' };
    case 'paragraph':
      return { id, type: 'paragraph', text: '' };
    case 'divider':
      return { id, type: 'divider' };
    case 'page-break':
      return { id, type: 'page-break' };
    case 'image':
      return { id, type: 'image', documentId: '' };
  }
}

export function wordCountForBlocks(blocks: ObituaryBlock[]): number {
  const text = blocks
    .filter((b): b is Extract<ObituaryBlock, { type: 'heading' | 'paragraph' }> =>
      b.type === 'heading' || b.type === 'paragraph',
    )
    .map((b) => b.text)
    .join(' ')
    .trim();
  return text === '' ? 0 : text.split(/\s+/).length;
}

export function wordCountGuidance(count: number): { text: string; tone: 'muted' | 'warning' } {
  if (count === 0) return { text: '0 words', tone: 'muted' };
  if (count < 100) return { text: `${count} words — brief for most outlets (typical: 100-200)`, tone: 'muted' };
  if (count <= 200) return { text: `${count} words — typical for local newspaper listings (100-200)`, tone: 'muted' };
  if (count <= 350) return { text: `${count} words — on the longer side (typical: 100-200)`, tone: 'muted' };
  return { text: `${count} words — longer than most outlets accept; consider trimming for print submission`, tone: 'warning' };
}

/** Client-side mirror of the backend's serializeBlocksToPlainText (obituary-content.util.ts). */
export function serializeBlocksToPlainText(blocks: ObituaryBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'paragraph') {
      parts.push(block.text);
    } else if (block.type === 'divider') {
      parts.push('---');
    }
  }
  return parts.join('\n\n');
}

/** Splits a flat block list into pages at each page-break block (exclusive). */
export function splitIntoPages(blocks: ObituaryBlock[]): ObituaryBlock[][] {
  const pages: ObituaryBlock[][] = [[]];
  for (const block of blocks) {
    if (block.type === 'page-break') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(block);
    }
  }
  return pages;
}

export function summarizeBlocks(blocks: ObituaryBlock[]): string {
  const counts = { paragraphs: 0, headings: 0, images: 0, pages: splitIntoPages(blocks).length };
  for (const b of blocks) {
    if (b.type === 'paragraph') counts.paragraphs++;
    if (b.type === 'heading') counts.headings++;
    if (b.type === 'image') counts.images++;
  }
  const parts: string[] = [];
  if (counts.headings) parts.push(`${counts.headings} heading${counts.headings > 1 ? 's' : ''}`);
  if (counts.paragraphs) parts.push(`${counts.paragraphs} paragraph${counts.paragraphs > 1 ? 's' : ''}`);
  if (counts.images) parts.push(`${counts.images} image${counts.images > 1 ? 's' : ''}`);
  parts.push(`${counts.pages} page${counts.pages > 1 ? 's' : ''}`);
  return parts.join(', ');
}
