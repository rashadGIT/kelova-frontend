'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { getCases } from '@/lib/api/cases';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { allTabs } from '@/components/cases/case-nav-groups';

/**
 * Breadcrumb label + searchable case switcher for the case-detail top bar,
 * mirroring GitHub's "org / repo ▾" breadcrumb + "Switch repository" popover.
 * The funeral home name is plain text (not itself interactive); only the
 * case name + chevron open the switcher.
 *
 * No backend text-search endpoint exists for cases, so this fetches a batch
 * of the 100 most recently updated cases once and filters client-side as the
 * user types — real, functional search, just scoped to that recent batch
 * rather than the full historical caseload.
 */
export function CaseSwitcher({ caseId, currentCaseName }: { caseId: string; currentCaseName?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pathname = usePathname();

  const base = `/cases/${caseId}`;
  const activeTab = allTabs.find((tab) =>
    tab.href === '' ? pathname === base : pathname.startsWith(`${base}${tab.href}`),
  );

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
  });

  const { data: casesPage, isLoading } = useQuery({
    queryKey: ['case-switcher-list'],
    queryFn: () => getCases({ limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' }),
    enabled: open,
  });

  const cases = casesPage?.data ?? [];
  const filtered = cases.filter((c) =>
    c.deceasedName.toLowerCase().includes(search.toLowerCase()),
  );

  const initials = currentCaseName
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .filter((c, i, arr) => i === 0 || i === arr.length - 1)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-1.5 min-w-0 text-sm">
      <span className="text-muted-foreground truncate shrink-0 hidden sm:inline">{settings?.name}</span>
      <span className="text-muted-foreground shrink-0 hidden sm:inline">/</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 min-w-0 font-semibold hover:text-muted-foreground transition-colors">
            <span className="truncate sm:hidden">{initials}</span>
            <span className="truncate hidden sm:inline">{currentCaseName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        </PopoverTrigger>
        {activeTab && (
          <>
            <span className="text-muted-foreground shrink-0 hidden sm:inline">/</span>
            <span className="text-muted-foreground truncate shrink-0 hidden sm:inline">{activeTab.label}</span>
          </>
        )}
        <PopoverContent align="start" className="w-80 p-0">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold mb-2">Switch case</p>
            <Input
              placeholder="Search cases…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No matching cases.</p>
            ) : (
              filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="truncate">{c.deceasedName}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <CaseStatusBadge status={c.status} />
                    {c.id === caseId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </Link>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
