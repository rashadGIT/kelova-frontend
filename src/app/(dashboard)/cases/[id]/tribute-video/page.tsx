'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getTributeVideoStatus } from '@/lib/api/case-extras';

function statusBadge(status: string) {
  if (status === 'ready') return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
  if (status === 'generating') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Generating</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
}

export default function TributeVideoPage({ params }: { params: { id: string } }) {
  const { data: videoStatus, isLoading } = useQuery({
    queryKey: ['tribute-video', params.id],
    queryFn: () => getTributeVideoStatus(params.id),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tribute Video" />

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Video Status</CardTitle>
              {videoStatus && statusBadge(videoStatus.status)}
            </div>
          </CardHeader>
          <CardContent>
            {videoStatus?.status === 'ready' && videoStatus.videoUrl ? (
              <div className="rounded-lg bg-muted h-64 flex items-center justify-center text-muted-foreground text-sm">
                Video player — {videoStatus.videoUrl}
              </div>
            ) : videoStatus?.status === 'generating' ? (
              <div className="rounded-lg bg-muted/50 h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Video is being generated...</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg h-36 flex items-center justify-center text-muted-foreground text-sm">
            Click to upload photos or drag and drop
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Music Track</CardTitle>
        </CardHeader>
        <CardContent>
          <select className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Select a music track</option>
            <option value="amazing_grace">Amazing Grace</option>
            <option value="how_great">How Great Thou Art</option>
            <option value="ave_maria">Ave Maria</option>
          </select>
        </CardContent>
      </Card>

      <Button disabled={videoStatus?.status === 'generating'}>
        {videoStatus?.status === 'generating' ? 'Generating...' : 'Generate Video'}
      </Button>
    </div>
  );
}
