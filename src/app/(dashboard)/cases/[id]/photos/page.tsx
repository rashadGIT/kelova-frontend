'use client';

import { use, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Trash2, X, ZoomIn } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getCasePhotos, presignPhoto, confirmPhoto, deletePhoto } from '@/lib/api/photos';
import axios from 'axios';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function PhotoGallery({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', caseId],
    queryFn: () => getCasePhotos(caseId),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deletePhoto(caseId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', caseId] });
      toast.success('Photo deleted.');
    },
    onError: () => toast.error('Failed to delete photo.'),
  });

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) => ACCEPTED.includes(f.type));
      if (validFiles.length === 0) {
        toast.error('Only JPEG, PNG, WebP, and GIF images are supported.');
        return;
      }
      setUploading(true);
      let succeeded = 0;
      for (const file of validFiles) {
        try {
          const { uploadUrl, photoId } = await presignPhoto(caseId, file.name, file.type);
          await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
          await confirmPhoto(caseId, photoId);
          succeeded++;
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      setUploading(false);
      if (succeeded > 0) {
        queryClient.invalidateQueries({ queryKey: ['photos', caseId] });
        toast.success(`${succeeded} photo${succeeded > 1 ? 's' : ''} uploaded.`);
      }
    },
    [caseId, queryClient],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">
          {uploading ? 'Uploading…' : 'Drop photos here or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, GIF</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No photos yet. Upload the first one above.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.fileName}
                className="w-full h-full object-cover rounded-md cursor-pointer"
                onClick={() => setLightbox(photo.url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-md flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightbox(photo.url)}
                  className="p-1 bg-white/90 rounded text-foreground hover:bg-white"
                  aria-label="View photo"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = photo.url;
                    a.download = photo.fileName;
                    a.click();
                  }}
                  className="p-1 bg-white/90 rounded text-foreground hover:bg-white text-xs font-medium"
                  aria-label="Download photo"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteMutation.mutate(photo.id)}
                  className="p-1 bg-white/90 rounded text-destructive hover:bg-white"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:text-white/70"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size photo"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function CasePhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PhotoGallery caseId={id} />
    </div>
  );
}
