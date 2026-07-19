'use client';

import { useQuery } from '@tanstack/react-query';
import { getCasePhotos } from '@/lib/api/photos';
import type { ObituaryBlock } from '@/types';
import { splitIntoPages } from './obituary-content.util';

function PreviewBlock({
  block,
  photoUrls,
}: {
  block: ObituaryBlock;
  photoUrls: Record<string, string>;
}) {
  if (block.type === 'heading') {
    return <h3 className="text-base font-semibold">{block.text}</h3>;
  }
  if (block.type === 'paragraph') {
    return <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">{block.text}</p>;
  }
  if (block.type === 'divider') {
    return <hr className="border-t" />;
  }
  if (block.type === 'image') {
    const url = photoUrls[block.documentId];
    if (!url) return null;
    return (
      <figure className="space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={block.caption ?? ''} className="max-h-80 rounded-md border object-cover" />
        {block.caption && (
          <figcaption className="text-xs text-muted-foreground">{block.caption}</figcaption>
        )}
      </figure>
    );
  }
  return null;
}

export function BlockPreview({ caseId, blocks }: { caseId: string; blocks: ObituaryBlock[] }) {
  const { data: photos = [] } = useQuery({
    queryKey: ['photos', caseId],
    queryFn: () => getCasePhotos(caseId),
  });
  const photoUrls = Object.fromEntries(photos.map((p) => [p.id, p.url]));

  const pages = splitIntoPages(blocks);

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Your obituary draft will appear here as you add content.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {pages.map((page, i) => (
        <div key={i} className="space-y-3">
          {pages.length > 1 && (
            <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
              — Page {i + 1} —
            </p>
          )}
          {page.map((block) => (
            <PreviewBlock key={block.id} block={block} photoUrls={photoUrls} />
          ))}
        </div>
      ))}
    </div>
  );
}
