'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';

/**
 * Grows with its content instead of scrolling internally — the page
 * scrolls, not the box. Prevents the cramped fixed-height + scrollbar look
 * on narrow (mobile) viewports.
 */
const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ className, value, onChange, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    resize(innerRef.current);
  }, [value, resize]);

  return (
    <Textarea
      ref={(el) => {
        innerRef.current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      }}
      value={value}
      onChange={(e) => {
        resize(e.target);
        onChange?.(e);
      }}
      rows={1}
      className={cn('resize-none overflow-hidden', className)}
      {...props}
    />
  );
});
AutoGrowTextarea.displayName = 'AutoGrowTextarea';

export { AutoGrowTextarea };
