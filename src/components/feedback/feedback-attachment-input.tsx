'use client';

import { X, Paperclip, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { presignFeedbackAttachment, uploadToS3 } from '@/lib/api/feedback';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILES = 3;

interface AttachmentState {
  file: File;
  preview: string | null; // object URL for images
  s3Key: string | null;
  progress: number; // 0–100
  uploading: boolean;
  error: string | null;
}

interface Props {
  onChange: (s3Keys: string[]) => void;
}

export function FeedbackAttachmentInput({ onChange }: Props) {
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedKeys = () =>
    attachments.filter(a => a.s3Key).map(a => a.s3Key as string);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_FILES - attachments.length);

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      const isVideo = file.type.startsWith('video/');
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > limit) {
        toast.error(`${file.name}: exceeds ${isVideo ? '100 MB' : '10 MB'} limit`);
        continue;
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      const id = attachments.length + Math.random(); // local key for state update

      const entry: AttachmentState = { file, preview, s3Key: null, progress: 0, uploading: true, error: null };

      setAttachments(prev => {
        const next = [...prev, entry];
        onChange(next.filter(a => a.s3Key).map(a => a.s3Key as string));
        return next;
      });

      try {
        const { uploadUrl, s3Key } = await presignFeedbackAttachment(file.name, file.type);
        await uploadToS3(uploadUrl, file, pct => {
          setAttachments(prev =>
            prev.map(a => (a.file === file ? { ...a, progress: pct } : a)),
          );
        });
        setAttachments(prev => {
          const next = prev.map(a =>
            a.file === file ? { ...a, s3Key, uploading: false, progress: 100 } : a,
          );
          onChange(next.filter(a => a.s3Key).map(a => a.s3Key as string));
          return next;
        });
      } catch {
        setAttachments(prev =>
          prev.map(a =>
            a.file === file ? { ...a, uploading: false, error: 'Upload failed' } : a,
          ),
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }

  function remove(file: File) {
    setAttachments(prev => {
      const next = prev.filter(a => a.file !== file);
      onChange(next.filter(a => a.s3Key).map(a => a.s3Key as string));
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {attachments.map(a => (
        <div
          key={a.file.name + a.file.size}
          className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm"
        >
          {a.preview ? (
            <img src={a.preview} alt={a.file.name} className="h-10 w-10 rounded object-cover shrink-0" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-xs">
              {a.file.type.includes('video') ? '🎬' : '📎'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{a.file.name}</p>
            {a.uploading ? (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            ) : a.error ? (
              <p className="text-destructive text-xs">{a.error}</p>
            ) : (
              <p className="text-muted-foreground text-xs">Uploaded</p>
            )}
          </div>
          {a.uploading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <button
              type="button"
              onClick={() => remove(a.file)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      {attachments.length < MAX_FILES && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="w-full gap-2"
          >
            <Paperclip className="h-4 w-4" />
            Attach screenshot or video ({attachments.length}/{MAX_FILES})
          </Button>
        </>
      )}
    </div>
  );
}
