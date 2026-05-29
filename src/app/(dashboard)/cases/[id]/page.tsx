import { Suspense } from 'react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseOverview } from '@/components/cases/case-overview';
import { FamilyMessagesCard } from '@/components/cases/family-messages-card';
import { PageHeader } from '@/components/layout/page-header';
import { getCaseById } from '@/lib/api/cases';

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await getCaseById(id).catch(() => null);
  const title = caseData?.deceasedName ?? 'Case Details';

  return (
    <div>
      <div className="hidden sm:block">
        <PageHeader title={title} description="Case Details" />
      </div>
      <CaseWorkspaceTabs caseId={id} caseName={title} />
      <div className="space-y-4">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <CaseOverview caseId={id} initialData={caseData ?? undefined} />
        </Suspense>
        <FamilyMessagesCard caseId={id} />
      </div>
    </div>
  );
}
