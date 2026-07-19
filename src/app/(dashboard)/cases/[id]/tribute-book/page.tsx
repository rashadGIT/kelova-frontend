'use client';

import { use, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Wand2, Check, Mail } from 'lucide-react';
import axios from 'axios';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { getCasePhotos, presignPhoto, confirmPhoto, type CasePhoto } from '@/lib/api/photos';
import { getDocumentDownloadUrl } from '@/lib/api/documents';
import { formatRelative } from '@/lib/utils/format-date';
import {
  getTributeBook,
  generateTributeBook,
  selectTributeBookPhotos,
  setTributeBookCoverPhoto,
  setTributeBookIncludeGuestbook,
  shareTributeBookWithFamily,
  type TributeBook,
} from '@/lib/api/tribute-book';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function PhotoPicker({
  caseId,
  book,
  onSelectionChange,
  onCoverChange,
}: {
  caseId: string;
  book: TributeBook;
  onSelectionChange: (ids: string[]) => void;
  onCoverChange: (id: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', caseId],
    queryFn: () => getCasePhotos(caseId),
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

  const toggleSelected = (photo: CasePhoto) => {
    const selected = new Set(book.photoDocumentIds);
    if (selected.has(photo.id)) selected.delete(photo.id);
    else selected.add(photo.id);
    onSelectionChange(Array.from(selected));
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      >
        <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-sm font-medium">
          {uploading ? 'Uploading…' : 'Click to upload more photos'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
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
          No photos yet. Upload some above to include in the book.
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {photos.map((photo) => {
            const isSelected = book.photoDocumentIds.includes(photo.id);
            const isCover = book.coverPhotoDocumentId === photo.id;
            return (
              <div key={photo.id} className="relative aspect-square group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  onClick={() => toggleSelected(photo)}
                  className={cn(
                    'w-full h-full object-cover rounded-md cursor-pointer border-2',
                    isSelected ? 'border-primary' : 'border-transparent',
                  )}
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <button
                  onClick={() => onCoverChange(isCover ? null : photo.id)}
                  className={cn(
                    'absolute bottom-1 left-1 right-1 text-[10px] font-medium rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                    isCover
                      ? 'bg-primary text-primary-foreground opacity-100'
                      : 'bg-white/90 text-foreground',
                  )}
                >
                  {isCover ? 'Cover photo' : 'Set as cover'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TributeBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ['tribute-book', caseId],
    queryFn: () => getTributeBook(caseId),
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 2000 : false,
  });

  const { data: previewUrl } = useQuery({
    queryKey: ['tribute-book-preview-url', book?.generatedDocumentId],
    queryFn: () => getDocumentDownloadUrl(book!.generatedDocumentId!),
    enabled: !!book?.generatedDocumentId,
  });

  const selectPhotosMutation = useMutation({
    mutationFn: (ids: string[]) => selectTributeBookPhotos(caseId, ids),
    onSuccess: (data) => {
      queryClient.setQueryData(['tribute-book', caseId], data);
    },
    onError: () => toast.error('Failed to update photo selection.'),
  });

  const setCoverMutation = useMutation({
    mutationFn: (documentId: string | null) => setTributeBookCoverPhoto(caseId, documentId),
    onSuccess: (data) => {
      queryClient.setQueryData(['tribute-book', caseId], data);
    },
    onError: () => toast.error('Failed to set cover photo.'),
  });

  const toggleGuestbookMutation = useMutation({
    mutationFn: (includeGuestbook: boolean) =>
      setTributeBookIncludeGuestbook(caseId, book!.id, includeGuestbook),
    onSuccess: (data) => {
      queryClient.setQueryData(['tribute-book', caseId], data);
    },
    onError: () => toast.error('Failed to update setting.'),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateTributeBook(caseId),
    onSuccess: (data) => {
      queryClient.setQueryData(['tribute-book', caseId], data);
      toast.success('Generating tribute book…');
    },
    onError: () => toast.error('Failed to start generation.'),
  });

  const shareMutation = useMutation({
    mutationFn: () => shareTributeBookWithFamily(caseId),
    onSuccess: (data) => {
      queryClient.setQueryData(['tribute-book', caseId], data);
      toast.success('Shared with family.');
    },
    onError: (e: unknown) => {
      const message = axios.isAxiosError(e)
        ? (e.response?.data?.message as string | undefined)
        : undefined;
      toast.error(message ?? 'Failed to share with family.');
    },
  });

  if (isLoading || !book) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tribute Book" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isGenerating = book.status === 'generating';
  const hasGenerated = !!book.generatedDocumentId;

  return (
    <div className="space-y-6">
      <PageHeader title="Tribute Book" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoPicker
            caseId={caseId}
            book={book}
            onSelectionChange={(ids) => selectPhotosMutation.mutate(ids)}
            onCoverChange={(id) => setCoverMutation.mutate(id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Options</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Include Guestbook Messages</p>
              <p className="text-xs text-muted-foreground">
                Include messages left on the online memorial guestbook
              </p>
            </div>
            <button
              onClick={() => toggleGuestbookMutation.mutate(!book.includeGuestbook)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                book.includeGuestbook ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                  book.includeGuestbook ? 'translate-x-5' : 'translate-x-1',
                )}
              />
            </button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {isGenerating
                ? 'Generating…'
                : hasGenerated
                  ? 'Preview ready'
                  : 'No preview yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {book.photoDocumentIds.length} photo{book.photoDocumentIds.length === 1 ? '' : 's'} selected
            </p>
            {book.sharedWithFamilyAt && (
              <p className="text-xs text-muted-foreground">
                Shared with family on {formatRelative(book.sharedWithFamilyAt)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => shareMutation.mutate()}
              disabled={!hasGenerated || shareMutation.isPending}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              {shareMutation.isPending ? 'Sharing…' : 'Share for Review'}
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating || generateMutation.isPending}
            >
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              {isGenerating ? 'Generating…' : hasGenerated ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && previewUrl && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Preview</CardTitle>
            <a
              href={previewUrl}
              download
              className="text-xs text-primary hover:underline"
            >
              Download
            </a>
          </CardHeader>
          <CardContent>
            <iframe src={previewUrl} className="w-full h-[600px] rounded-md border" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
