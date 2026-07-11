import type { ReactNode } from 'react';

/**
 * Two-column case detail shell: main content + a narrow right-hand metadata
 * rail, mirroring GitHub's PR page layout (conversation + Reviewers/Assignees/
 * Milestone sidebar). The rail collapses below `lg` since there's no room for
 * it on narrower dashboard viewports.
 */
export function CaseDetailLayout({ main, sidebar }: { main: ReactNode; sidebar: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="min-w-0 flex-1 lg:max-w-[calc(100%-21rem)]">{main}</div>
      <div className="lg:w-80 shrink-0">{sidebar}</div>
    </div>
  );
}
