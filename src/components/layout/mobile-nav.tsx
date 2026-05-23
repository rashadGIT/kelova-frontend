'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Calendar, CheckSquare, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAdminStore } from '@/lib/store/admin.store';

const MOBILE_TABS = [
  { label: 'Home', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Cases', href: '/cases', icon: FolderOpen, exact: false },
  { label: 'Calendar', href: '/calendar', icon: Calendar, exact: false },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, exact: false },
  { label: 'More', href: '/settings', icon: MoreHorizontal, exact: false },
];

export function MobileNav() {
  const pathname = usePathname();
  const activeTenantId = useAdminStore((s) => s.activeTenantId);

  if (activeTenantId) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-stretch">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href) && tab.href !== '/';
          const isHome = tab.href === '/' && pathname === '/';
          const active = isActive || isHome;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors min-h-[56px]',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <tab.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
