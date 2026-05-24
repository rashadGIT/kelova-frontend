'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Share2, Heart, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getPublicMemorial, addGuestbookEntry } from '@/lib/api/memorial';
import type { GuestbookEntry } from '@/lib/api/memorial';

const guestbookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  message: z.string().min(1, 'Message is required'),
});

type GuestbookFormValues = z.infer<typeof guestbookSchema>;

function formatMemorialDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PublicMemorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['memorial-public', slug],
    queryFn: () => getPublicMemorial(slug),
    retry: false,
  });

  const form = useForm<GuestbookFormValues>({
    resolver: zodResolver(guestbookSchema),
  });

  const guestbookMutation = useMutation({
    mutationFn: (values: GuestbookFormValues) =>
      addGuestbookEntry(slug, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-public', slug] });
      toast.success('Your message has been added.');
      form.reset();
      setGuestbookOpen(false);
    },
    onError: () => toast.error('Failed to add message. Please try again.'),
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: page?.slug ?? 'Memorial', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Memorial page not found</p>
          <p className="text-sm text-muted-foreground">
            This page may not be published yet or the link may be incorrect.
          </p>
        </div>
      </div>
    );
  }

  const entries = Array.isArray(page.guestbookEntries)
    ? (page.guestbookEntries as GuestbookEntry[])
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            In Loving Memory
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            A place to remember and celebrate a life well lived.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Biography */}
        {page.bioText && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Tribute
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {page.bioText}
            </p>
          </section>
        )}

        {/* Photo gallery */}
        {page.photoUrls.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {page.photoUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxSrc(url)}
                  className="aspect-square overflow-hidden rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {page.photoUrls.length === 0 && !page.bioText && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">No content has been added yet.</p>
          </div>
        )}

        {/* Guestbook */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Guestbook{entries.length > 0 ? ` (${entries.length})` : ''}
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGuestbookOpen((v) => !v)}
            >
              {guestbookOpen ? 'Cancel' : 'Leave a Message'}
            </Button>
          </div>

          {guestbookOpen && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <form
                  onSubmit={form.handleSubmit((v) =>
                    guestbookMutation.mutate(v),
                  )}
                  className="space-y-3"
                  noValidate
                >
                  <div>
                    <Label htmlFor="gb-name">Your Name</Label>
                    <Input
                      id="gb-name"
                      placeholder="Jane Smith"
                      {...form.register('name')}
                      aria-invalid={!!form.formState.errors.name}
                    />
                    {form.formState.errors.name && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gb-message">Message</Label>
                    <Textarea
                      id="gb-message"
                      placeholder="Share a memory or words of comfort..."
                      rows={3}
                      {...form.register('message')}
                      aria-invalid={!!form.formState.errors.message}
                    />
                    {form.formState.errors.message && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={guestbookMutation.isPending}
                  >
                    {guestbookMutation.isPending ? 'Posting...' : 'Post Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Be the first to leave one.
            </p>
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().map((entry, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm leading-relaxed">{entry.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      — {entry.name}
                      {entry.createdAt && (
                        <span className="ml-2">
                          {formatMemorialDate(entry.createdAt)}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-full rounded-md object-contain"
          />
        </div>
      )}
    </div>
  );
}
