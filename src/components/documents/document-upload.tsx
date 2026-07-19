'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/dashboard/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { DocumentType } from '@/types';
import { getPresignedUploadUrl, confirmDocumentUpload } from '@/lib/api/documents';
import axios from 'axios';

export function DocumentUpload({ caseId }: { caseId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.other);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, documentId } = await getPresignedUploadUrl(caseId, file.name, file.type, docType);
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type }, withCredentials: false });
      await confirmDocumentUpload(caseId, documentId);
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      toast.success('Document uploaded.');
      if (inputRef.current) inputRef.current.value = '';
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  });

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
        <SelectTrigger className="w-full sm:w-44 min-w-0"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.values(DocumentType).map((t) => (
            <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
      }} />
      <Button size="sm" variant="outline" disabled={uploadMutation.isPending} onClick={() => inputRef.current?.click()} className="w-full sm:w-auto shrink-0">
        <Upload className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate">{uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}</span>
      </Button>
    </div>
  );
}
