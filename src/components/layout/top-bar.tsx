'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MobileSidebarTrigger } from './sidebar';
import { useAuthStore } from '@/lib/store/auth.store';
import { useAdminStore } from '@/lib/store/admin.store';
import { logout } from '@/lib/api/auth';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  funeral_director: 'Funeral Director',
  staff: 'Staff',
};

export function TopBar() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const { exitTenantView } = useAdminStore();

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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-background/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
      <MobileSidebarTrigger />
      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.picture} alt={user?.name ?? ''} referrerPolicy="no-referrer" />
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user?.picture} alt={user?.name ?? ''} referrerPolicy="no-referrer" />
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
