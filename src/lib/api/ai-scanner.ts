import { apiClient } from './client';

export type ScanTargetField =
  | 'death_certificate'
  | 'insurance_policy'
  | 'removal_authorization'
  | 'general';

export interface AiScanResult {
  id: string;
  caseId: string;
  documentId: string;
  targetField: string;
  extractedFields: Record<string, unknown>;
  confidence: number;
  rawText: string | null;
  status: 'pending' | 'scanning' | 'complete' | 'error';
  createdAt: string;
}

export async function initiateScan(
  caseId: string,
  documentId: string,
  targetField: ScanTargetField,
): Promise<{ scanId: string }> {
  const res = await apiClient.post<{ scanId: string }>(
    `/cases/${caseId}/documents/${documentId}/scan`,
    { targetField },
  );
  return res.data;
}

export async function getScanResult(
  caseId: string,
  documentId: string,
  scanId: string,
): Promise<AiScanResult> {
  const res = await apiClient.get<AiScanResult>(
    `/cases/${caseId}/documents/${documentId}/scan-result/${scanId}`,
  );
  return res.data;
}

export async function applyToCase(
  caseId: string,
  documentId: string,
  scanId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await apiClient.post(
    `/cases/${caseId}/documents/${documentId}/apply-scan/${scanId}`,
    { fields },
  );
}
