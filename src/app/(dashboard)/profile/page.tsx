'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { useAuthStore } from '@/lib/store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  funeral_director: 'Funeral Director',
  staff: 'Staff',
};

export default function ProfilePage() {
  const { user } = useAuthStore();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const fields = [
    { label: 'Full Name', value: user?.name },
    { label: 'Email', value: user?.email },
    { label: 'Role', value: user?.role ? (ROLE_LABELS[user.role] ?? user.role) : undefined },
  ];

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account information.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.picture} alt={user?.name ?? ''} referrerPolicy="no-referrer" />
              <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user?.name ?? '—'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4 grid gap-4">
            {fields.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-3 items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="col-span-2 text-sm break-all">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Profile details are managed through your identity provider. Contact your administrator to make changes.
      </p>
    </div>
  );
}
