'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import { SendIntakeFormButton } from '@/components/cases/send-intake-form-button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';

const groups = [
  {
    label: 'Main',
    tabs: [
      { label: 'Overview', href: '' },
      { label: 'Tasks', href: '/tasks' },
      { label: 'Documents', href: '/documents' },
      { label: 'Payments', href: '/payments' },
    ],
  },
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
      { label: 'Follow-ups', href: '/follow-ups' },
      { label: 'Photos', href: '/photos' },
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

const allTabs = [
  { label: 'Overview', href: '' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
  ...groups.flatMap((g) => g.tabs),
];

export function CaseMobileHeader({ caseId, caseName }: { caseId: string; caseName: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}`;
  const [open, setOpen] = useState(false);

  const active =
    allTabs.find((t) =>
      t.href === '' ? pathname === base : pathname.startsWith(`${base}${t.href}`),
    ) ?? allTabs[0];

  return (
    <div className="sm:hidden mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground truncate">{caseName}</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-2xl font-semibold text-left group"
          >
            {active.label}
            <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors" />
          </button>
          <SendIntakeFormButton caseId={caseId} />
        </div>
        <SheetContent side="bottom" className="!z-[60] pb-20 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">Sections</SheetTitle>
          </SheetHeader>
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const href = `${base}${tab.href}`;
                  const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
                  return (
                    <Link
                      key={tab.label}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground',
                      )}
                    >
                      {tab.label}
                      {isActive && <Check className="h-4 w-4 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </SheetContent>
      </Sheet>

      <Separator className="mt-4" />
    </div>
  );
}
