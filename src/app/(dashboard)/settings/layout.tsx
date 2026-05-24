'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TABS = [
  { label: 'Branding', href: '/settings/branding' },
  { label: 'Staff', href: '/settings/staff' },
  { label: 'Templates', href: '/settings/templates' },
  { label: 'Integrations', href: '/settings/integrations' },
  { label: 'API & Webhooks', href: '/settings/api' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = TABS.find((t) => t.href === pathname);

  return (
    <div className="space-y-6">
      {/* Mobile: dropdown */}
      <div className="sm:hidden">
        <Select value={pathname} onValueChange={(href) => router.push(href)}>
          <SelectTrigger className="w-full">
            <SelectValue>{current?.label ?? 'Settings'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TABS.map((tab) => (
              <SelectItem key={tab.href} value={tab.href}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: tab bar */}
      <div className="hidden sm:block border-b">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                pathname === tab.href
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
