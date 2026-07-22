'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { primaryTabs, groups } from '@/components/cases/case-nav-groups';

/**
 * Row-2 tab bar for case detail pages: direct tabs (Overview/Tasks/Documents/
 * Payments) plus a grouped dropdown per category — consolidates the old flat
 * 15-item "More" list into the same 5-group structure CaseMobileHeader already
 * uses, so there's one source of truth for "what are this case's sections."
 */
export function CaseTopBarTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/cases/${caseId}`;

  return (
    <div className="hidden sm:block border-b border-border overflow-x-auto">
      <nav className="flex -mb-px px-4 md:px-6" aria-label="Case sections">
        {primaryTabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors shrink-0',
                isActive
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}

        {groups.map((group) => {
          const isGroupActive = group.tabs.some((tab) => pathname.startsWith(`${base}${tab.href}`));
          return (
            <DropdownMenu key={group.label}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors inline-flex items-center gap-1 shrink-0',
                    isGroupActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                  )}
                >
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {group.tabs.map((tab) => {
                  const href = `${base}${tab.href}`;
                  const isActive = pathname.startsWith(href);
                  return (
                    <DropdownMenuItem
                      key={tab.label}
                      className={cn(isActive && 'bg-accent text-accent-foreground font-medium')}
                      onSelect={() => router.push(href)}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </nav>
    </div>
  );
}
