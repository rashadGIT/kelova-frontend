'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Building2,
  DollarSign,
  Menu,
  BookOpen,
  ShieldCheck,
  Users,
  LogOut,
  BarChart2,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAdminStore } from '@/lib/store/admin.store';
import { useQueryClient } from '@tanstack/react-query';
import { useMessagingStore } from '@/lib/store/messaging.store';

export const regularNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Cases', href: '/cases', icon: FolderOpen, exact: false },
  { label: 'Calendar', href: '/calendar', icon: Calendar, exact: false },
  { label: 'Messages', href: '/messaging', icon: MessageSquare, exact: false },
  { label: 'Vendors', href: '/vendors', icon: Building2, exact: false },
  { label: 'Pre-Need', href: '/preneed', icon: BookOpen, exact: false, directorOnly: true },
  { label: 'Price List', href: '/price-list', icon: DollarSign, exact: false, directorOnly: true },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, exact: false, directorOnly: true },
  { label: 'Multi-Location', href: '/multi-location', icon: Layers, exact: false, directorOnly: true },
];

export const adminNavItems = [
  { label: 'Funeral Homes', href: '/super-admin/tenants', icon: ShieldCheck, exact: false },
  { label: 'All Users', href: '/super-admin/users', icon: Users, exact: false },
];

function NavLink({
  item,
  onClick,
  badge,
}: {
  item: { label: string; href: string; icon: React.ElementType; exact: boolean };
  onClick?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
        isActive
          ? 'bg-muted text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground font-normal',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!!badge && badge > 0 && (
        <Badge variant="default" className="h-5 min-w-5 text-xs px-1.5 ml-auto">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </Link>
  );
}

function TenantViewBanner({ name, onExit }: { name: string; onExit: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
      <p className="text-xs text-amber-700 font-medium truncate">Viewing</p>
      <p className="text-xs font-semibold truncate">{name}</p>
      <button
        onClick={onExit}
        className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 transition-colors"
      >
        <LogOut className="h-3 w-3" />
        Exit tenant view
      </button>
    </div>
  );
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact: boolean;
}

/**
 * Single source of truth for "which nav items does this user see right now" —
 * shared by the sidebar sheet and the top-bar tab row so the two surfaces
 * can't drift out of sync with each other.
 */
export function useVisibleNavItems(): { items: NavItem[]; mode: 'admin' | 'regular'; totalUnread: number } {
  const { isSuperAdmin, isStaff } = useCurrentUser();
  const { activeTenantId } = useAdminStore();
  const totalUnread = useMessagingStore((s) => s.totalUnread());

  // Mode A: super_admin in admin context (no tenant selected)
  const inAdminView = isSuperAdmin && !activeTenantId;

  const visibleRegularItems = regularNavItems.filter(
    (item) => !item.directorOnly || !isStaff,
  );

  return {
    items: inAdminView ? adminNavItems : visibleRegularItems,
    mode: inAdminView ? 'admin' : 'regular',
    totalUnread,
  };
}

export function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { isSuperAdmin } = useCurrentUser();
  const { activeTenantId, activeTenantName, exitTenantView } = useAdminStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, totalUnread } = useVisibleNavItems();

  const handleExit = () => {
    exitTenantView();
    queryClient.clear();
    router.push('/super-admin/tenants');
    onClose?.();
  };

  // Mode B: super_admin viewing a specific tenant
  const inTenantView = isSuperAdmin && !!activeTenantId;

  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4 border-b border-border/60">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">K</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Kelova</span>
      </div>

      {/* Tenant view banner */}
      {inTenantView && activeTenantName && (
        <div className="pt-3">
          <TenantViewBanner name={activeTenantName} onExit={handleExit} />
        </div>
      )}

      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onClick={onClose}
            badge={item.href === '/messaging' ? totalUnread : undefined}
          />
        ))}
      </nav>
    </div>
  );
}

// Hamburger trigger — rendered inside TopBar, pops out the nav at every breakpoint.
// There is no persistent desktop rail; the sheet is the only way to reach the nav.
export function SidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="touch-target">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
