import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  href?: string;
  delta?: number;
  format?: 'number' | 'currency';
}

export function StatCard({ title, value, icon: Icon, description, loading, href, delta, format = 'number' }: StatCardProps) {
  const displayValue = value ?? 0;
  const formatted = format === 'currency'
    ? displayValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : displayValue;

  const card = (
    <Card className={`h-full${href ? ' cursor-pointer transition-colors hover:bg-muted/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col justify-between min-h-[72px]">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div
              key={String(formatted)}
              className="text-3xl font-semibold animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {formatted}
            </div>
          )}
        </div>
        <div>
          {delta !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full mt-1',
              delta >= 0
                ? 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]'
                : 'bg-destructive/10 text-destructive',
            )}>
              {delta >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)} since yesterday
            </span>
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
