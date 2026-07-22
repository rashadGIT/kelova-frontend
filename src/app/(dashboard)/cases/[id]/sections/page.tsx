'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { use } from 'react';

const groups = [
  {
    label: 'Intake & Legal',
    tabs: [
      { label: 'First Call', href: '/first-call' },
      { label: 'Death Certificate', href: '/death-certificate' },
      { label: 'Cremation Auth', href: '/cremation-auth' },
      { label: 'Signatures', href: '/signatures' },
    ],
  },
  {
    label: 'Arrangements',
    tabs: [
      { label: 'Arrangement', href: '/arrangement' },
      { label: 'Merchandise', href: '/merchandise' },
      { label: 'Cemetery', href: '/cemetery' },
      { label: 'Memorial', href: '/memorial' },
      { label: 'Accommodations', href: '/accommodations' },
    ],
  },
  {
    label: 'Family & Follow-up',
    tabs: [
      { label: 'Obituary', href: '/obituary' },
      { label: 'Veteran Benefits', href: '/veteran-benefits' },
    ],
  },
  {
    label: 'Operations',
    tabs: [
      { label: 'Vendors', href: '/vendors' },
      { label: 'Tracking', href: '/tracking' },
    ],
  },
];

export default function SectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const base = `/cases/${id}`;

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sm:hidden">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-medium">Sections</span>
      </div>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.label} className="mt-6 first:mt-0 sm:mt-4">
          <h3 className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <ul className="border-t border-border">
            {group.tabs.map((tab) => {
              const href = `${base}${tab.href}`;
              const isActive = pathname.startsWith(href);
              return (
                <li key={tab.label} className="border-b border-border">
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 transition-colors active:bg-muted',
                      isActive ? 'bg-accent/50' : 'hover:bg-muted/50',
                    )}
                  >
                    <span className={cn('text-base', isActive && 'font-medium text-foreground')}>
                      {tab.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
