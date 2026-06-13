'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
  getAdminFeedbackDetail,
  getFeedbackAttachmentUrls,
  updateFeedbackStatus,
  retryClickupTask,
  type FeedbackStatus,
} from '@/lib/api/feedback';

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  general: 'General',
};

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | null>(null);

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-feedback-detail', id],
    queryFn: () => getAdminFeedbackDetail(id),
  });

  const { data: attachments } = useQuery({
    queryKey: ['feedback-attachments', id],
    queryFn: () => getFeedbackAttachmentUrls(id),
    staleTime: 10 * 60 * 1000, // 10 min — signed URLs are 15-min TTL
    enabled: !!feedback,
  });

  const statusMutation = useMutation({
    mutationFn: (status: FeedbackStatus) => updateFeedbackStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const clickupMutation = useMutation({
    mutationFn: () => retryClickupTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-detail', id] });
      toast.success('ClickUp task created');
    },
    onError: () => toast.error('Failed to create ClickUp task'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!feedback) return null;

  const currentStatus = selectedStatus ?? feedback.status;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`${CATEGORY_LABELS[feedback.category] ?? feedback.category} Feedback`}
        description={`Submitted ${new Date(feedback.createdAt).toLocaleString()}`}
      />

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Category</p>
            <Badge variant="outline" className="mt-1">{CATEGORY_LABELS[feedback.category]}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <Select
                value={currentStatus}
                onValueChange={v => setSelectedStatus(v as FeedbackStatus)}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStatus && selectedStatus !== feedback.status && (
                <Button
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(currentStatus)}
                >
                  {statusMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Submitter</p>
            <p className="mt-1 font-medium">{feedback.submitterName ?? 'Anonymous'}</p>
            {feedback.submitterEmail && (
              <p className="text-muted-foreground text-xs">{feedback.submitterEmail}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Page</p>
            {feedback.pageUrl ? (
              <a
                href={feedback.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-primary hover:underline text-xs break-all"
              >
                {feedback.pageUrl} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="mt-1 text-muted-foreground">—</p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">ClickUp</p>
            <div className="mt-1">
              {feedback.clickupTaskId ? (
                <a
                  href={`https://app.clickup.com/t/${feedback.clickupTaskId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View task <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={clickupMutation.isPending}
                  onClick={() => clickupMutation.mutate()}
                  className="gap-1"
                >
                  {clickupMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                  Create ClickUp task
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{feedback.message}</pre>
        </CardContent>
      </Card>

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments ({attachments.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {attachments.map(({ key, url }) => {
              const isVideo = key.match(/\.(mp4|webm)$/i);
              return isVideo ? (
                <video
                  key={key}
                  src={url}
                  controls
                  className="w-full rounded-lg border"
                />
              ) : (
                <Dialog key={key}>
                  <DialogTrigger asChild>
                    <img
                      src={url}
                      alt="Feedback attachment"
                      className="w-full rounded-lg border cursor-zoom-in object-cover aspect-video"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-2">
                    <img src={url} alt="Feedback attachment" className="w-full rounded" />
                  </DialogContent>
                </Dialog>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
