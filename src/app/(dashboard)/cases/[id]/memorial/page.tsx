'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { ExternalLink, Globe, EyeOff } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getCaseMemorial,
  createMemorial,
  updateMemorial,
  type GuestbookEntry,
} from '@/lib/api/memorial';

const memorialSchema = z.object({
  bioText: z.string().optional(),
  photoUrls: z.string().optional(),
});

type MemorialFormValues = z.infer<typeof memorialSchema>;

function MemorialManager({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: memorial, isLoading } = useQuery({
    queryKey: ['case-memorial', caseId],
    queryFn: () => getCaseMemorial(caseId),
  });

  const form = useForm<MemorialFormValues>({
    resolver: standardSchemaResolver(memorialSchema),
    defaultValues: {
      bioText: memorial?.bioText ?? '',
      photoUrls: memorial?.photoUrls?.join('\n') ?? '',
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createMemorial(caseId, { published: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-memorial', caseId] });
      toast.success('Memorial page created.');
    },
    onError: () => toast.error('Failed to create memorial page.'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: MemorialFormValues) => {
      if (!memorial) throw new Error('No memorial to update');
      const photoUrls = (values.photoUrls ?? '')
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      return updateMemorial(memorial.id, {
        bioText: values.bioText,
        photoUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-memorial', caseId] });
      toast.success('Memorial page updated.');
      setEditing(false);
    },
    onError: () => toast.error('Failed to update memorial page.'),
  });

  const togglePublishMutation = useMutation({
    mutationFn: () => {
      if (!memorial) throw new Error('No memorial to update');
      return updateMemorial(memorial.id, { published: !memorial.published });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['case-memorial', caseId] });
      toast.success(
        updated.published ? 'Memorial page is now public.' : 'Memorial page hidden.',
      );
    },
    onError: () => toast.error('Failed to update visibility.'),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!memorial) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No memorial page yet. Create one to share a tribute with the family.
          </p>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Memorial Page'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const publicUrl = `${window.location.origin}/memorial/${memorial.slug}`;
  const entries = Array.isArray(memorial.guestbookEntries)
    ? (memorial.guestbookEntries as GuestbookEntry[])
    : [];

  return (
    <div className="space-y-4">
      {/* Status + actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Memorial Page</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={memorial.published ? 'default' : 'secondary'}>
                {memorial.published ? 'Public' : 'Hidden'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePublishMutation.mutate()}
                disabled={togglePublishMutation.isPending}
              >
                {memorial.published ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Publish
                  </>
                )}
              </Button>
              {memorial.published && (
                <Button size="sm" variant="outline" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground text-xs break-all">{publicUrl}</p>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(publicUrl);
              toast.success('Link copied.');
            }}
          >
            Copy link
          </Button>
        </CardContent>
      </Card>

      {/* Content editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Content</CardTitle>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => {
                form.reset({
                  bioText: memorial.bioText ?? '',
                  photoUrls: memorial.photoUrls.join('\n'),
                });
                setEditing(true);
              }}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="bio-text">Tribute / Biography</Label>
                <Textarea
                  id="bio-text"
                  rows={6}
                  placeholder="Write a tribute to be displayed on the memorial page..."
                  {...form.register('bioText')}
                />
              </div>
              <div>
                <Label htmlFor="photo-urls">
                  Photo URLs{' '}
                  <span className="text-muted-foreground font-normal">
                    (one per line)
                  </span>
                </Label>
                <Textarea
                  id="photo-urls"
                  rows={4}
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                  {...form.register('photoUrls')}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              {memorial.bioText ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {memorial.bioText}
                </p>
              ) : (
                <p className="text-muted-foreground">No tribute text added.</p>
              )}
              {memorial.photoUrls.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {memorial.photoUrls.length} photo
                    {memorial.photoUrls.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {memorial.photoUrls.slice(0, 4).map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="h-16 w-16 object-cover rounded-md border border-border"
                      />
                    ))}
                    {memorial.photoUrls.length > 4 && (
                      <div className="h-16 w-16 rounded-md border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{memorial.photoUrls.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guestbook moderation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Guestbook{entries.length > 0 ? ` (${entries.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <div className="divide-y">
              {[...entries].reverse().map((entry, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm">{entry.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    — {entry.name}
                    {entry.createdAt && (
                      <span className="ml-2">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseMemorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <MemorialManager caseId={id} />
    </div>
  );
}
