'use client';

import { cn } from '@/lib/utils/cn';

interface KevolaLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function KevolaLogo({ className, iconOnly = false }: KevolaLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="7" className="fill-foreground" />
        <path
          d="M9.5 8v12"
          className="stroke-background"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.5 14.5l5.5-5.5"
          className="stroke-background"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.5 13.5l5.5 5.5"
          className="stroke-background"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!iconOnly && (
        <span className="text-lg font-semibold tracking-tight">Kelova</span>
      )}
    </div>
  );
}
