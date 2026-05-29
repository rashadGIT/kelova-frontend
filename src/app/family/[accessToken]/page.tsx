import { notFound } from 'next/navigation';
import { FamilyPortalView } from './family-portal-view';
import { PortalAuthGate } from './portal-auth-gate';

interface PortalCase {
  id: string;
  deceasedName: string;
  status: string;
  stage: string;
  serviceType: string;
  arrangementDate: string | null;
  createdAt: string;
  familyInfoSubmittedAt: string | null;
}

interface PortalDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploaded: boolean;
  createdAt: string;
}

interface PortalTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  rsvpToken: string | null;
  rsvpStatus: string | null;
}

interface PortalAccess {
  caseId: string;
  contactId: string;
  expiresAt: string;
  lastViewed: string | null;
}

export interface PortalData {
  portalAccess: PortalAccess;
  case: PortalCase | null;
  contacts: { id: string; name: string; relationship: string; isPrimaryContact: boolean }[];
  documents: PortalDocument[];
  tasks: PortalTask[];
}

type PortalFetchResult =
  | { state: 'ok'; data: PortalData }
  | { state: 'unverified'; maskedEmail: string }
  | { state: 'notfound' };

async function fetchPortalData(accessToken: string): Promise<PortalFetchResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/family-portal/${accessToken}`, {
      cache: 'no-store',
    });
    if (res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as { maskedEmail?: string };
      return { state: 'unverified', maskedEmail: body.maskedEmail ?? '' };
    }
    if (!res.ok) return { state: 'notfound' };
    return { state: 'ok', data: (await res.json()) as PortalData };
  } catch {
    return { state: 'notfound' };
  }
}

export default async function FamilyPortalPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;
  const result = await fetchPortalData(accessToken);

  if (result.state === 'notfound') notFound();

  if (result.state === 'unverified') {
    return <PortalAuthGate token={accessToken} maskedEmail={result.maskedEmail} />;
  }

  if (!result.data.case) notFound();

  // Mark as viewed (fire-and-forget — don't block render)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  void fetch(`${apiUrl}/family-portal/${accessToken}/viewed`, { method: 'PATCH' });

  return <FamilyPortalView data={result.data} accessToken={accessToken} />;
}
