'use client';

import Link from 'next/link';
import { allTabs } from './case-nav-groups';

export function titleCase(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function tabHref(caseId: string, label: string) {
  const tab = allTabs.find((t) => t.label === label);
  return tab ? `/cases/${caseId}${tab.href}` : undefined;
}

export function DetailBlockLink({ href, label, value }: { href?: string; label: string; value: string }) {
  if (!href) return null;
  return (
    <Link href={href} className="flex flex-col gap-0.5 rounded-md p-1 -m-1 hover:bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </Link>
  );
}
