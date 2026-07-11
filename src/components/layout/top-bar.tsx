'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LogOut,
  User,
  Heart,
  Settings,
  Sparkles,
  Rocket,
  Search,
  MessageSquare,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { SidebarTrigger, regularNavItems, adminNavItems } from './sidebar';
import { TopBarTabs } from './top-bar-tabs';
import { CaseTopBarTabs } from './case-top-bar-tabs';
import { CaseSwitcher } from './case-switcher';
import { useAuthStore } from '@/lib/store/auth.store';
import { useAdminStore } from '@/lib/store/admin.store';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { logout } from '@/lib/api/auth';
import { getCaseById } from '@/lib/api/cases';
import { cn } from '@/lib/utils/cn';
import { getCaseIdFromPathname } from '@/lib/utils/routes';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  funeral_director: 'Funeral Director',
  staff: 'Staff',
};

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardHome = pathname === '/';
  const caseId = getCaseIdFromPathname(pathname);
  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById(caseId!),
    enabled: !!caseId,
  });
  const { user, clearUser } = useAuthStore();
  const { exitTenantView } = useAdminStore();
  const { canAccessSettings } = useCurrentUser();
  const totalUnread = useMessagingStore((s) => s.totalUnread());

  async function handleLogout() {
    await logout();
    clearUser();
    exitTenantView();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const isIndividualCase = !!caseId;

  const pageTitle = useMemo(() => {
    if (isDashboardHome) return 'Dashboard';
    const match = [...regularNavItems, ...adminNavItems]
      .filter((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.label;
  }, [pathname, isDashboardHome]);

  return (
    <header className={cn('sticky top-0 z-30 bg-background/95 backdrop-blur-sm', !isIndividualCase && 'border-b border-border')}>
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <SidebarTrigger />

        {!caseId && pageTitle && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-6 w-6 rounded-md bg-primary hidden sm:flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">K</span>
            </div>
            <span className="text-sm font-semibold">{pageTitle}</span>
          </div>
        )}

        {caseId && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-primary hidden sm:flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">K</span>
            </div>
            <CaseSwitcher caseId={caseId} currentCaseName={caseData?.deceasedName} />
          </div>
        )}

        <div className="flex-1" />

        {/* Search: full input on sm+, icon-only on mobile to avoid row-1 overflow */}
        <div className="relative w-64 hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Type to search"
            disabled
            aria-disabled
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" disabled aria-disabled aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => router.push('/messaging')}
            aria-label="Messages"
          >
            <MessageSquare className="h-4 w-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex" disabled aria-disabled aria-label="Activity">
            <Activity className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex" disabled aria-disabled aria-label="AI Assistant">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} alt={user?.name ?? ''} referrerPolicy="no-referrer" />
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user?.picture} alt={user?.name ?? ''} referrerPolicy="no-referrer" />
                  <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user?.name ?? 'Staff'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {user?.role && (
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled aria-disabled>
              <Heart className="mr-2 h-4 w-4" />
              Referrals
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {canAccessSettings && (
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled aria-disabled className="justify-between">
              <span className="flex items-center">
                <Rocket className="mr-2 h-4 w-4" />
                Upgrade Plan
              </span>
              <Badge variant="subtle" className="text-[10px] px-1.5 py-0">Starter</Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {caseId ? (
        <CaseTopBarTabs caseId={caseId} />
      ) : (
        !isDashboardHome && <TopBarTabs />
      )}
    </header>
  );
}
