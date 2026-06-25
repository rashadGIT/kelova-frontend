import { apiClient } from './client';

export interface ContributionPortalInfo {
  deceasedName: string;
  contactName: string;
  relationship: string;
  alreadySubmitted: boolean;
}

export interface ContributionRecord {
  id: string;
  familyContactId: string;
  token: string;
  tokenExpiresAt: string;
  contributionText: string | null;
  submittedAt: string | null;
  createdAt: string;
  familyContact: {
    id: string;
    name: string;
    relationship: string;
    email: string | null;
  };
}

export interface SubmitContributionPayload {
  favoriteMemory?: string;
  description?: string;
  loved?: string;
  anythingElse?: string;
}

export async function getContributionByToken(
  token: string,
): Promise<ContributionPortalInfo> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/public/obituary-contributions/${token}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitContribution(
  token: string,
  payload: SubmitContributionPayload,
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/public/obituary-contributions/${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

export async function requestContributions(
  caseId: string,
): Promise<{ sent: number }> {
  const res = await apiClient.post(
    `/cases/${caseId}/obituary/request-contributions`,
  );
  return res.data;
}

export async function listContributions(
  caseId: string,
): Promise<ContributionRecord[]> {
  const res = await apiClient.get(`/cases/${caseId}/obituary/contributions`);
  return res.data;
}

export async function resendContribution(
  caseId: string,
  contactId: string,
): Promise<{ sent: number }> {
  const res = await apiClient.post(
    `/cases/${caseId}/obituary/resend-contribution/${contactId}`,
  );
  return res.data;
}
