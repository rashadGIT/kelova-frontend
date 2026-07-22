'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, Minus, Pilcrow, Trash2, Type } from 'lucide-react';
import { getCasePhotos } from '@/lib/api/photos';
import { AutoGrowTextarea } from '@/components/ui/autogrow-textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/dashboard/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ObituaryBlock } from '@/types';
import { createBlock } from './obituary-content.util';
import { ImagePickerDialog } from './image-picker-dialog';

function BlockRenderer({
  block,
  photoUrls,
  onChange,
  onOpenImagePicker,
}: {
  block: ObituaryBlock;
  photoUrls: Record<string, string>;
  onChange: (block: ObituaryBlock) => void;
  onOpenImagePicker: () => void;
}) {
  if (block.type === 'heading') {
    return (
      <Input
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Heading"
        className="text-base font-semibold"
      />
    );
  }
  if (block.type === 'paragraph') {
    return (
      <AutoGrowTextarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Write a paragraph…"
        className="text-sm"
      />
    );
  }
  if (block.type === 'divider') {
    return <hr className="border-t border-dashed" />;
  }
  if (block.type === 'page-break') {
    return (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        Page Break
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  // image
  const url = photoUrls[block.documentId];
  return (
    <div className="space-y-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={block.caption ?? 'Obituary photo'}
          className="max-h-64 rounded-md border object-cover cursor-pointer"
          onClick={onOpenImagePicker}
        />
      ) : (
        <button
          type="button"
          onClick={onOpenImagePicker}
          className="w-full rounded-md border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          Click to choose a photo
        </button>
      )}
      <Input
        value={block.caption ?? ''}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        className="text-xs"
      />
    </div>
  );
}

function SortableBlockItem({
  block,
  photoUrls,
  onChange,
  onRemove,
  onOpenImagePicker,
}: {
  block: ObituaryBlock;
  photoUrls: Record<string, string>;
  onChange: (block: ObituaryBlock) => void;
  onRemove: () => void;
  onOpenImagePicker: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 rounded-md border bg-background p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Reorder block"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <BlockRenderer
          block={block}
          photoUrls={photoUrls}
          onChange={onChange}
          onOpenImagePicker={onOpenImagePicker}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
        aria-label="Remove block"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddBlockToolbar({ onAdd }: { onAdd: (type: ObituaryBlock['type']) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => onAdd('heading')}>
        <Type className="h-3.5 w-3.5 mr-1.5" />
        Heading
      </Button>
      <Button size="sm" variant="outline" onClick={() => onAdd('paragraph')}>
        <Pilcrow className="h-3.5 w-3.5 mr-1.5" />
        Paragraph
      </Button>
      <Button size="sm" variant="outline" onClick={() => onAdd('image')}>
        <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
        Image
      </Button>
      <Button size="sm" variant="outline" onClick={() => onAdd('divider')}>
        <Minus className="h-3.5 w-3.5 mr-1.5" />
        Divider
      </Button>
      <Button size="sm" variant="outline" onClick={() => onAdd('page-break')}>
        Page Break
      </Button>
    </div>
  );
}

export function BlockEditor({
  caseId,
  blocks,
  onChange,
}: {
  caseId: string;
  blocks: ObituaryBlock[];
  onChange: (blocks: ObituaryBlock[]) => void;
}) {
  const [imagePickerForBlockId, setImagePickerForBlockId] = useState<string | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', caseId],
    queryFn: () => getCasePhotos(caseId),
  });
  const photoUrls = Object.fromEntries(photos.map((p) => [p.id, p.url]));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  function updateBlock(updated: ObituaryBlock) {
    onChange(blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function addBlock(type: ObituaryBlock['type']) {
    onChange([...blocks, createBlock(type)]);
  }

  return (
    <div className={cn('space-y-3')}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {blocks.map((block) => (
              <SortableBlockItem
                key={block.id}
                block={block}
                photoUrls={photoUrls}
                onChange={updateBlock}
                onRemove={() => removeBlock(block.id)}
                onOpenImagePicker={() => setImagePickerForBlockId(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground italic py-2">
          No content yet. Click Generate to create a draft, or add a block below.
        </p>
      )}

      <AddBlockToolbar onAdd={addBlock} />

      <ImagePickerDialog
        caseId={caseId}
        open={imagePickerForBlockId !== null}
        onOpenChange={(open) => {
          if (!open) setImagePickerForBlockId(null);
        }}
        onSelect={(documentId) => {
          const targetId = imagePickerForBlockId;
          if (!targetId) return;
          const target = blocks.find((b) => b.id === targetId);
          if (target && target.type === 'image') {
            updateBlock({ ...target, documentId });
          }
        }}
      />
    </div>
  );
}
