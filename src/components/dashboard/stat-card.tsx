import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

type Intent = 'info' | 'success' | 'warning' | 'destructive' | 'muted';

const intentMap: Record<Intent, { bubble: string; bar: string }> = {
  info:        { bubble: 'bg-info-bg text-info',               bar: 'bg-info' },
  success:     { bubble: 'bg-success-bg text-success',         bar: 'bg-success' },
  warning:     { bubble: 'bg-warning-bg text-warning',         bar: 'bg-warning' },
  destructive: { bubble: 'bg-destructive-bg text-destructive', bar: 'bg-destructive' },
  muted:       { bubble: 'bg-muted text-muted-foreground',     bar: 'bg-muted-foreground/40' },
};

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  href?: string;
  delta?: number;
  format?: 'number' | 'currency';
  intent?: Intent;
}

export function StatCard({ title, value, icon: Icon, description, loading, href, delta, format = 'number', intent = 'muted' }: StatCardProps) {
  const displayValue = value ?? 0;
  const formatted = format === 'currency'
    ? displayValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : displayValue;

  const { bubble, bar } = intentMap[intent];

  const card = (
    <Card className={cn(
      'h-full relative overflow-hidden',
      href && 'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md',
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', bar)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', bubble)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-between min-h-[72px]">
        <div>
          {loading ? (
            <Skeleton className="h-10 w-20" />
          ) : (
            <div className="text-4xl font-bold tabular-nums">{formatted}</div>
          )}
        </div>
        <div>
          {delta !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} since yesterday</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
