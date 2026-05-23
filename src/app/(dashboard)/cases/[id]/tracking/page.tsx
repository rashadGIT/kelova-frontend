'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Printer, QrCode } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCaseTracking,
  getTrackingQrCode,
  scanUpdate,
  TRACKING_STATUSES,
  STATUS_LABELS,
  type TrackingStatus,
} from '@/lib/api/tracking';
import { formatDate } from '@/lib/utils/format-date';

const scanSchema = z.object({
  status: z.enum(TRACKING_STATUSES),
  location: z.string().optional(),
  note: z.string().optional(),
});

type ScanFormValues = z.infer<typeof scanSchema>;

const STATUS_COLORS: Record<TrackingStatus, string> = {
  pending_pickup: 'bg-slate-100 text-slate-700',
  in_transit: 'bg-blue-100 text-blue-700',
  at_facility: 'bg-indigo-100 text-indigo-700',
  in_preparation: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  at_service: 'bg-purple-100 text-purple-700',
  at_disposition: 'bg-orange-100 text-orange-700',
  complete: 'bg-emerald-100 text-emerald-700',
};

function TrackingTab({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [showQr, setShowQr] = useState(false);

  const { data: tracking, isLoading } = useQuery({
    queryKey: ['tracking', caseId],
    queryFn: () => getCaseTracking(caseId),
    retry: false,
  });

  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ['tracking-qr', caseId],
    queryFn: () => getTrackingQrCode(caseId),
    enabled: showQr,
  });

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: { status: 'at_facility' },
  });

  const scanMutation = useMutation({
    mutationFn: (values: ScanFormValues) =>
      scanUpdate(caseId, {
        status: values.status,
        location: values.location || undefined,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', caseId] });
      toast.success('Custody event recorded.');
      form.reset({ status: 'at_facility' });
    },
    onError: () => toast.error('Failed to record scan event.'),
  });

  const log = tracking?.trackingLog ?? [];

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Chain of Custody QR Code</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQr((v) => !v)}
            >
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              {showQr ? 'Hide QR' : 'Show QR'}
            </Button>
            {showQr && qrData && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showQr ? (
            qrLoading ? (
              <Skeleton className="h-48 w-48" />
            ) : qrData ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData.dataUrl}
                  alt="Chain of custody QR code"
                  className="w-48 h-48 print:w-64 print:h-64"
                />
                <p className="text-xs text-muted-foreground">
                  Scan to update custody status
                </p>
              </div>
            ) : null
          ) : (
            <p className="text-sm text-muted-foreground">
              Display and print this QR code to attach to the decedent's transfer bag or container.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : tracking ? (
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tracking.status as TrackingStatus] ?? ''}`}
              >
                {STATUS_LABELS[tracking.status as TrackingStatus] ?? tracking.status}
              </span>
              {tracking.location && (
                <span className="text-sm text-muted-foreground">
                  {tracking.location}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                Updated {formatDate(tracking.updatedAt)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tracking record yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Update status form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record Custody Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => scanMutation.mutate(v))}
            className="space-y-3"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scan-status">Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="scan-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACKING_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="scan-location">Location</Label>
                <Input
                  id="scan-location"
                  placeholder="e.g. Preparation room B"
                  {...form.register('location')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="scan-note">Note</Label>
              <Input
                id="scan-note"
                placeholder="Optional notes"
                {...form.register('note')}
              />
            </div>
            <Button type="submit" disabled={scanMutation.isPending}>
              {scanMutation.isPending ? 'Saving...' : 'Record Event'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Chain-of-custody log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custody Log</CardTitle>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {[...log].reverse().map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[entry.status as TrackingStatus] ?? entry.status}
                      </Badge>
                      {entry.location && (
                        <span className="text-xs text-muted-foreground">
                          {entry.location}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDate(entry.scannedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <TrackingTab caseId={id} />
    </div>
  );
}
