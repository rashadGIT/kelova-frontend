export interface CaseNavTab {
  label: string;
  href: string;
}

export interface CaseNavGroup {
  label: string;
  tabs: CaseNavTab[];
}

/** Direct tabs shown at all times, not tucked into a group dropdown. */
export const primaryTabs: CaseNavTab[] = [
  { label: 'Overview', href: '' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
];

/**
 * The remaining ~15 case sub-pages, grouped into categories. Shared source of
 * truth for both the mobile bottom-sheet (CaseMobileHeader) and the desktop
 * row-2 grouped dropdowns (CaseTopBarTabs) so the two can't drift apart.
 */
export const groups: CaseNavGroup[] = [
  {
    label: 'Intake & Legal',
    tabs: [
      { label: 'First Call', href: '/first-call' },
      { label: 'Death Certificate', href: '/death-certificate' },
      { label: 'Cremation Auth', href: '/cremation-auth' },
      { label: 'Signatures', href: '/signatures' },
    ],
  },
  {
    label: 'Arrangements',
    tabs: [
      { label: 'Arrangement', href: '/arrangement' },
      { label: 'Merchandise', href: '/merchandise' },
      { label: 'Cemetery', href: '/cemetery' },
      { label: 'Memorial', href: '/memorial' },
      { label: 'Accommodations', href: '/accommodations' },
    ],
  },
  {
    label: 'Family & Follow-up',
    tabs: [
      { label: 'Obituary', href: '/obituary' },
      { label: 'Follow-ups', href: '/follow-ups' },
      { label: 'Photos', href: '/photos' },
      { label: 'Veteran Benefits', href: '/veteran-benefits' },
    ],
  },
  {
    label: 'Operations',
    tabs: [
      { label: 'Vendors', href: '/vendors' },
      { label: 'Tracking', href: '/tracking' },
    ],
  },
];

export const allTabs: CaseNavTab[] = [...primaryTabs, ...groups.flatMap((g) => g.tabs)];

/**
 * Mobile bottom-sheet (CaseMobileHeader) shows "Main" as its own labeled
 * section alongside the other 4 — this preserves that original 5-section
 * layout even though the desktop tab bar treats primaryTabs as direct tabs.
 */
export const mobileGroups: CaseNavGroup[] = [{ label: 'Main', tabs: primaryTabs }, ...groups];
