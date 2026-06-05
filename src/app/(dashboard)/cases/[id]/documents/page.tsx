'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { DocumentUpload } from '@/components/documents/document-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, ScanLine, CheckSquare } from 'lucide-react';
import { getCaseDocuments, getDocumentDownloadUrl } from '@/lib/api/documents';
import {
  initiateScan,
  getScanResult,
  applyToCase,
  type AiScanResult,
  type ScanTargetField,
} from '@/lib/api/ai-scanner';
import { formatDate } from '@/lib/utils/format-date';
import { toast } from 'sonner';
import type { IDocument } from '@/types';

const TARGET_FIELD_LABELS: Record<ScanTargetField, string> = {
  death_certificate: 'Death Certificate',
  insurance_policy: 'Insurance Policy',
  removal_authorization: 'Removal Authorization',
  general: 'General Document',
};

function ScanDialog({
  doc,
  caseId,
  onClose,
}: {
  doc: IDocument;
  caseId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [targetField, setTargetField] = useState<ScanTargetField>('death_certificate');
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<AiScanResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [polling, setPolling] = useState(false);

  const initMutation = useMutation({
    mutationFn: () => initiateScan(caseId, doc.id, targetField),
    onSuccess: ({ scanId: id }) => {
      setScanId(id);
      setPolling(true);
      toast.info('Scan started. This may take a moment…');
    },
    onError: () => toast.error('Failed to start scan.'),
  });

  const applyMutation = useMutation({
    mutationFn: () => {
      const fields = Object.entries(scanResult?.extractedFields ?? {})
        .filter(([k]) => selectedFields[k])
        .reduce<Record<string, unknown>>((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      return applyToCase(caseId, doc.id, scanId!, fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      toast.success('Fields applied to case.');
      onClose();
    },
    onError: () => toast.error('Failed to apply fields.'),
  });

  // Poll until complete
  useEffect(() => {
    if (!polling || !scanId) return;
    const interval = setInterval(async () => {
      try {
        const result = await getScanResult(caseId, doc.id, scanId);
        if (result.status === 'complete' || result.status === 'error') {
          setPolling(false);
          setScanResult(result);
          if (result.status === 'complete') {
            const defaults: Record<string, boolean> = {};
            Object.keys(result.extractedFields).forEach((k) => { defaults[k] = true; });
            setSelectedFields(defaults);
          } else {
            toast.error('Scan failed. Try again.');
          }
        }
      } catch {
        setPolling(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, scanId, caseId, doc.id]);

  const extractedEntries = Object.entries(scanResult?.extractedFields ?? {}).filter(
    ([k]) => k !== 'rawText' && k !== 'error',
  );

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>AI Document Scanner</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Scanning: <span className="font-medium text-foreground">{doc.fileName}</span>
      </p>

      {!scanId && (
        <div className="space-y-3">
          <div>
            <Label>Document Type</Label>
            <Select
              value={targetField}
              onValueChange={(v) => setTargetField(v as ScanTargetField)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TARGET_FIELD_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
            className="w-full"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            {initMutation.isPending ? 'Starting scan…' : 'Start AI Scan'}
          </Button>
        </div>
      )}

      {polling && (
        <div className="text-center py-6 space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Extracting fields with AI…</p>
        </div>
      )}

      {scanResult?.status === 'complete' && extractedEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Extracted Fields</p>
          <p className="text-xs text-muted-foreground">
            Select the fields you want to apply to the case record.
          </p>
          <div className="rounded-xl border border-border divide-y divide-border/60 max-h-64 overflow-y-auto">
            {extractedEntries.map(([key, value]) => (
              <label
                key={key}
                className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!selectedFields[key]}
                  onChange={(e) =>
                    setSelectedFields((s) => ({ ...s, [key]: e.target.checked }))
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {String(value)}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || Object.values(selectedFields).every((v) => !v)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {applyMutation.isPending ? 'Applying…' : 'Apply to Case'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}

function DocumentList({ caseId }: { caseId: string }) {
  const [scanDoc, setScanDoc] = useState<IDocument | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', caseId],
    queryFn: () => getCaseDocuments(caseId),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (docs.length === 0)
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;

  return (
    <>
      <div className="rounded-xl border border-border divide-y divide-border/60">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{doc.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {doc.documentType} &middot; {formatDate(doc.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScanDoc(doc)}
                title="Scan with AI"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const url = await getDocumentDownloadUrl(doc.id);
                    window.open(url, '_blank');
                  } catch {
                    toast.error('Failed to get download link.');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!scanDoc} onOpenChange={(v) => { if (!v) setScanDoc(null); }}>
        {scanDoc && (
          <ScanDialog doc={scanDoc} caseId={caseId} onClose={() => setScanDoc(null)} />
        )}
      </Dialog>
    </>
  );
}

export default function CaseDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="space-y-4">
        <DocumentUpload caseId={id} />
        <DocumentList caseId={id} />
      </div>
    </div>
  );
}
