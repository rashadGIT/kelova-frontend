'use client';

import { ChevronDown, Search, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/dashboard/ui/button';

const PLACEHOLDER_ROWS = [
  'Intake Form.pdf',
  'Service Contract.pdf',
  'Death Certificate.pdf',
  'Payment Receipt.pdf',
];

/**
 * Placeholder utility row + file-browser area for the case detail main column,
 * mirroring GitHub's branch-selector row + repo file listing. Purely visual —
 * no real document data or click behavior yet. Labels are Kelova-themed
 * rather than GitHub's literal wording (Template/Revisions/Checkpoints/
 * Search this case/Add Document/Export).
 */
export function CaseFileBrowserPlaceholder() {
  return (
    <div className="space-y-0 rounded-md border border-border overflow-hidden">
      {/* Utility row */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
        <Button variant="outline" size="sm" disabled aria-disabled className="gap-1.5">
          Template
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          Revisions
        </span>
        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          Checkpoints
        </span>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search this case"
            disabled
            aria-disabled
            className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-xs text-muted-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
        <Button variant="outline" size="sm" disabled aria-disabled className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Document
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" disabled aria-disabled>
          Export
        </Button>
      </div>

      {/* File-browser placeholder */}
      <div className="divide-y divide-border">
        {PLACEHOLDER_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            <span>{row}</span>
          </div>
        ))}
      </div>
      <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
        Document browser — coming soon
      </p>
    </div>
  );
}
