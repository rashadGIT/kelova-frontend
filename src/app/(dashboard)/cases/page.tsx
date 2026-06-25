import { PageHeader } from '@/components/layout/page-header';
import { CaseTable } from '@/components/cases/case-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { key: undefined,            label: 'All' },
  { key: 'active',             label: 'Active' },
  { key: 'overdue',            label: 'Overdue' },
  { key: 'cremation',          label: 'Cremation' },
  { key: 'insurance',          label: 'Insurance' },
  { key: 'pending-signatures', label: 'Pending Signatures' },
] as const;

const FILTER_LABELS: Record<string, string> = {
  active:               'Active Cases',
  overdue:              'Overdue Tasks',
  cremation:            'Cremation Cases',
  insurance:            'Insurance Cases',
  'this-month':         'Cases This Month',
  'pending-signatures': 'Pending Signatures',
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const title = filter ? FILTER_LABELS[filter] ?? 'Cases' : 'Cases';

  return (
    <div>
      <PageHeader
        title={title}
        action={
          <Button asChild size="sm">
            <Link href="/cases/new">New Case</Link>
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map((tab) => {
          const isActive = filter === tab.key;
          const href = tab.key ? `/cases?filter=${tab.key}` : '/cases';
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <CaseTable filter={filter} />
    </div>
  );
}
