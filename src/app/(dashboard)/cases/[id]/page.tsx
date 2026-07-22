import { Suspense } from 'react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseOverview } from '@/components/cases/case-overview';
import { CaseDetailHeader } from '@/components/cases/case-detail-header';
import { CaseDetailSidebar } from '@/components/cases/case-detail-sidebar';
import { CaseDetailLayout } from '@/components/cases/case-detail-layout';
import { CaseFileBrowserPlaceholder } from '@/components/cases/case-file-browser-placeholder';
import { CaseCommentsPlaceholder } from '@/components/cases/case-comments-placeholder';
import { getCaseById } from '@/lib/api/cases';

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await getCaseById(id).catch(() => null);
  const title = caseData?.deceasedName ?? 'Case Details';

  return (
    <div>
      <div className="hidden sm:block">
        <CaseDetailHeader caseId={id} initialData={caseData ?? undefined} />
      </div>
      <CaseWorkspaceTabs caseId={id} caseName={title} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CaseDetailLayout
          main={
            <div className="space-y-6">
              <CaseOverview caseId={id} initialData={caseData ?? undefined} />
              <CaseFileBrowserPlaceholder />
              <CaseCommentsPlaceholder />
            </div>
          }
          sidebar={<CaseDetailSidebar caseId={id} initialData={caseData ?? undefined} />}
        />
      </Suspense>
    </div>
  );
}
