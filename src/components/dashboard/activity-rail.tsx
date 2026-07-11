'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/dashboard/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';

/**
 * Right-rail activity feed, styled like GitHub's "Latest from our changelog" card.
 * Placeholder content — no AuditLog query endpoint exists yet (the AuditLog table
 * is written to today, but nothing reads it back). Only the heading/description
 * text is role-real; the list entries are static mock content.
 */
const PLACEHOLDER_ENTRIES = [
  { actor: 'Team member', action: 'updated a case status', when: '2 hours ago' },
  { actor: 'Team member', action: 'added a new task', when: 'yesterday' },
  { actor: 'Team member', action: 'signed a document', when: 'yesterday' },
  { actor: 'Team member', action: 'created a new case', when: '2 days ago' },
];

export function ActivityRail() {
  const { isStaff } = useCurrentUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isStaff ? 'My Activity' : 'Team Activity'}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {isStaff ? "Recent changes you've made" : 'Recent changes made by your team'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {PLACEHOLDER_ENTRIES.map((entry, i) => (
          <div key={i} className="text-sm">
            <p>
              <span className="font-medium">{entry.actor}</span>{' '}
              <span className="text-muted-foreground">{entry.action}</span>
            </p>
            <p className="text-xs text-muted-foreground">{entry.when}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
