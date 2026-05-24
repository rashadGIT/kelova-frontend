'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getQBStatus, disconnectQB } from '@/lib/api/integrations';
import { apiClient } from '@/lib/api/client';

function QuickBooksCard() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const { data: status, isLoading } = useQuery({
    queryKey: ['qb-status'],
    queryFn: getQBStatus,
  });

  useEffect(() => {
    const qb = searchParams.get('qb');
    if (qb === 'connected') toast.success('QuickBooks connected successfully.');
    else if (qb === 'error') toast.error('QuickBooks connection failed. Please try again.');
  }, [searchParams]);

  const disconnectMutation = useMutation({
    mutationFn: disconnectQB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-status'] });
      toast.success('QuickBooks disconnected.');
    },
    onError: () => toast.error('Failed to disconnect QuickBooks.'),
  });

  const handleConnect = () => {
    // Redirect to backend OAuth endpoint — backend handles the Intuit redirect
    const base = apiClient.defaults.baseURL ?? '';
    window.location.href = `${base}/integrations/quickbooks/connect`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            QuickBooks Online
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : status?.connected ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500">
                <XCircle className="h-3 w-3 mr-1" />
                Not connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">
            Sync invoices, payments, and customers to QuickBooks Online automatically.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.connected && status.connectedAt && (
          <p className="text-xs text-muted-foreground">
            Connected on {new Date(status.connectedAt).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-2">
          {status?.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Connect QuickBooks
            </Button>
          )}
        </div>

        {status?.connected && (
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p>Once connected, use the <strong>Sync to QuickBooks</strong> button on any case payments page to push invoices and payments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect third-party services to streamline your workflow.
        </p>
      </div>

      <QuickBooksCard />
    </div>
  );
}
