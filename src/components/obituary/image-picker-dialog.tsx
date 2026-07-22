'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { getCasePhotos, presignPhoto, confirmPhoto, type CasePhoto } from '@/lib/api/photos';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImagePickerDialog({
  caseId,
  open,
  onOpenChange,
  onSelect,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (documentId: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', caseId],
    queryFn: () => getCasePhotos(caseId),
    enabled: open,
  });

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Only JPEG, PNG, WebP, and GIF images are supported.');
        return;
      }
      setUploading(true);
      try {
        const { uploadUrl, photoId } = await presignPhoto(caseId, file.name, file.type);
        await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
        await confirmPhoto(caseId, photoId);
        queryClient.invalidateQueries({ queryKey: ['photos', caseId] });
        onSelect(photoId);
        onOpenChange(false);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    },
    [caseId, queryClient, onSelect, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {uploading ? 'Uploading…' : 'Click to upload a new photo'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = '';
              }}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No photos on this case yet. Upload one above.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-72 overflow-y-auto">
              {photos.map((photo: CasePhoto) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    onSelect(photo.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
