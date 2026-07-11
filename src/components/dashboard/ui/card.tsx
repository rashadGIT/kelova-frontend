import * as React from "react"

import { cn } from "@/lib/utils/cn"

/**
 * Dashboard-only Card variants: flat, bordered, denser padding (GitHub Primer feel).
 * Forked from `@/components/ui/card` so public-facing routes (family portal,
 * memorial, pay, etc.) keep their original softer rounded/shadowed cards untouched.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border border-border bg-card text-card-foreground",
      className
    )}
    {...props}
  />
))
Card.displayName = "DashboardCard"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-4 border-b border-border", className)}
    {...props}
  />
))
CardHeader.displayName = "DashboardCardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "DashboardCardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "DashboardCardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
))
CardContent.displayName = "DashboardCardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 border-t border-border", className)}
    {...props}
  />
))
CardFooter.displayName = "DashboardCardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
