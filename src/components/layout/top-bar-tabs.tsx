'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { getCaseIdFromPathname } from '@/lib/utils/routes';
import { useVisibleNavItems } from './sidebar';

/**
 * Row-2 horizontal tab bar mirroring GitHub's Code/Issues/PR tabs, reusing the
 * exact same role-gated nav items the sidebar sheet shows (via useVisibleNavItems)
 * so the two nav surfaces can't drift out of sync.
 */
export function TopBarTabs() {
  const pathname = usePathname();
  const { items } = useVisibleNavItems();

  if (!getCaseIdFromPathname(pathname)) {
    return null;
  }

  return (
    <div className="border-b border-border overflow-x-auto">
      <nav className="flex -mb-px px-4 md:px-6" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors shrink-0',
                isActive
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
