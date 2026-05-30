'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Building2,
  DollarSign,
  Settings,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAdminStore } from '@/lib/store/admin.store';
import { useQueryClient } from '@tanstack/react-query';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { KevolaLogo } from '@/components/ui/logo';

const regularNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Cases', href: '/cases', icon: FolderOpen, exact: false },
  { label: 'Calendar', href: '/calendar', icon: Calendar, exact: false },
  { label: 'Messages', href: '/messaging', icon: MessageSquare, exact: false },
  { label: 'Vendors', href: '/vendors', icon: Building2, exact: false },
  { label: 'Pre-Need', href: '/preneed', icon: BookOpen, exact: false, directorOnly: true },
  { label: 'Price List', href: '/price-list', icon: DollarSign, exact: false, directorOnly: true },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, exact: false, directorOnly: true },
  { label: 'Multi-Location', href: '/multi-location', icon: Layers, exact: false, directorOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings, exact: false, adminOnly: true },
];

const adminNavItems = [
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
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-semibold'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground font-normal',
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-ring rounded-r-full" />
      )}
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
    <div className="mx-3 mb-3 rounded-md border border-[hsl(var(--warning-bg))] bg-[hsl(var(--warning-bg))] px-3 py-2">
      <p className="text-xs text-[hsl(var(--warning))] font-medium truncate">Viewing</p>
      <p className="text-xs font-semibold truncate">{name}</p>
      <button
        onClick={onExit}
        className="mt-1.5 flex items-center gap-1 text-xs text-[hsl(var(--warning))] hover:opacity-80 transition-opacity"
      >
        <LogOut className="h-3 w-3" />
        Exit tenant view
      </button>
    </div>
  );
}

function SidebarUserFooter() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    funeral_director: 'Director',
    staff: 'Staff',
  };

  return (
    <div className="border-t px-3 py-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
          <AvatarFallback className="text-[11px] font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate leading-tight">{user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { canAccessSettings, isSuperAdmin } = useCurrentUser();
  const { activeTenantId, activeTenantName, exitTenantView } = useAdminStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const totalUnread = useMessagingStore((s) => s.totalUnread());

  const handleExit = () => {
    exitTenantView();
    queryClient.clear();
    router.push('/super-admin/tenants');
    onClose?.();
  };

  // Mode B: super_admin viewing a specific tenant
  const inTenantView = isSuperAdmin && !!activeTenantId;

  // Mode A: super_admin in admin context (no tenant selected)
  const inAdminView = isSuperAdmin && !activeTenantId;

  // Regular users: filter by role flags
  const { isStaff } = useCurrentUser();
  const visibleRegularItems = regularNavItems.filter(
    (item) =>
      (!item.adminOnly || canAccessSettings) &&
      (!item.directorOnly || !isStaff),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center px-4 py-4 border-b">
        <KevolaLogo />
      </div>

      {/* Tenant view banner */}
      {inTenantView && activeTenantName && (
        <div className="pt-3">
          <TenantViewBanner name={activeTenantName} onExit={handleExit} />
        </div>
      )}

      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1">
        {inAdminView ? (
          // Mode A: admin-only nav
          adminNavItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))
        ) : (
          // Mode B (tenant view) or regular user: full nav
          visibleRegularItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={onClose}
              badge={item.href === '/messaging' ? totalUnread : undefined}
            />
          ))
        )}
      </nav>

      <SidebarUserFooter />
    </div>
  );
}

// Mobile hamburger trigger — rendered inside TopBar
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden touch-target">
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

// Desktop sidebar — always visible on md+
export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <SidebarContent />
    </aside>
  );
}
