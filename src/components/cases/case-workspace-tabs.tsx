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
import { useQuery } from '@tanstack/react-query';
import { getCaseById } from '@/lib/api/cases';
import { CaseMobileHeader } from './case-mobile-header';

const primaryTabs = [
  { label: 'Overview', href: '' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
];

export const overflowTabs = [
  { label: 'Obituary', href: '/obituary' },
  { label: 'Follow-ups', href: '/follow-ups' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Signatures', href: '/signatures' },
  { label: 'First Call', href: '/first-call' },
  { label: 'Death Certificate', href: '/death-certificate' },
  { label: 'Cremation Auth', href: '/cremation-auth' },
  { label: 'Merchandise', href: '/merchandise' },
  { label: 'Cemetery', href: '/cemetery' },
  { label: 'Memorial', href: '/memorial' },
  { label: 'Photos', href: '/photos' },
  { label: 'Tracking', href: '/tracking' },
  { label: 'Accommodations', href: '/accommodations' },
  { label: 'Arrangement', href: '/arrangement' },
  { label: 'Veteran Benefits', href: '/veteran-benefits' },
];

export function CaseWorkspaceTabs({ caseId, caseName }: { caseId: string; caseName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/cases/${caseId}`;

  const { data } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId),
    enabled: !caseName,
  });
  const resolvedName = caseName ?? data?.deceasedName ?? '';

  const activeOverflow = overflowTabs.find((tab) => pathname.startsWith(`${base}${tab.href}`));
  const isOverflowActive = !!activeOverflow;

  return (
    <div className="mb-6">
      <CaseMobileHeader caseId={caseId} caseName={resolvedName} />
      {/* Desktop: original tab bar */}
      <div className="hidden sm:block border-b">
        <nav className="flex -mb-px">
          {primaryTabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors inline-flex items-center gap-1',
                  isOverflowActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                )}
              >
                {isOverflowActive ? activeOverflow!.label : 'More'}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {overflowTabs.map((tab) => {
                const href = `${base}${tab.href}`;
                const isActive = pathname.startsWith(href);
                return (
                  <DropdownMenuItem
                    key={tab.label}
                    className={cn(
                      'cursor-pointer',
                      isActive && 'bg-accent text-accent-foreground font-medium',
                    )}
                    onSelect={() => router.push(href)}
                  >
                    {tab.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  );
}
