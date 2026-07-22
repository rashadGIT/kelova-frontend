'use client';

import { CaseMobileHeader } from './case-mobile-header';

/**
 * Desktop case-section nav lives in the top bar's row 2 (CaseTopBarTabs) —
 * this component now only renders the mobile bottom-sheet nav.
 */
export function CaseWorkspaceTabs({ caseId }: { caseId: string; caseName?: string }) {
  return <CaseMobileHeader caseId={caseId} />;
}
