'use client';

import { MessageSquare, Activity } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';

type FeedItem =
  | { type: 'comment'; author: string; body: string; createdAt: string }
  | { type: 'activity'; actor: string; action: string; entity: string; createdAt: string };

const FEED_ITEMS: FeedItem[] = [
  {
    type: 'comment',
    author: 'Jane Doe',
    body: 'Family confirmed the cremation authorization form will be signed tomorrow morning.',
    createdAt: 'Jul 5, 2026 · 2:14 PM',
  },
  {
    type: 'activity',
    actor: 'Jane Doe',
    action: 'uploaded',
    entity: 'Payment Receipt.pdf',
    createdAt: 'Jul 5, 2026 · 11:02 AM',
  },
  {
    type: 'comment',
    author: 'Mark Reyes',
    body: 'Reached out to the cemetery to confirm the plot location — waiting on their callback.',
    createdAt: 'Jul 4, 2026 · 4:47 PM',
  },
  {
    type: 'activity',
    actor: 'Mark Reyes',
    action: 'updated case status to',
    entity: 'In Progress',
    createdAt: 'Jul 4, 2026 · 9:30 AM',
  },
  {
    type: 'activity',
    actor: 'Jane Doe',
    action: 'uploaded',
    entity: 'Death Certificate.pdf',
    createdAt: 'Jul 3, 2026 · 3:15 PM',
  },
];

/**
 * Placeholder comments + activity feed for the case detail main column, shown
 * below the document browser. Purely visual — no real data or post behavior
 * yet. Item shape mirrors the future CaseNote (comment) and AuditLog
 * (activity) models so wiring in real data later is a data-fetch swap rather
 * than a redesign. Most-recent item first.
 */
export function CaseCommentsPlaceholder() {
  return (
    <div className="space-y-0 rounded-md border border-border overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
        <span className="text-sm font-medium text-foreground">Comments</span>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <input
          type="text"
          placeholder="Add a comment"
          disabled
          aria-disabled
          className="h-8 flex-1 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <Button size="sm" disabled aria-disabled>
          Post
        </Button>
      </div>

      {/* Feed */}
      <div className="divide-y divide-border">
        {FEED_ITEMS.map((item, index) => (
          <div key={index} className="flex items-start gap-2 px-3 py-2.5 text-sm">
            {item.type === 'comment' ? (
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              {item.type === 'comment' ? (
                <p className="text-foreground">
                  <span className="font-medium">{item.author}</span> {item.body}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{item.actor}</span> {item.action}{' '}
                  <span className="font-medium text-foreground">{item.entity}</span>
                </p>
              )}
              <span className="text-xs text-muted-foreground">{item.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
        Comments & activity — coming soon
      </p>
    </div>
  );
}
