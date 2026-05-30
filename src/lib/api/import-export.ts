import { apiClient } from './client';

export interface ImportRowError {
  row: number;
  entity: string;
  field?: string;
  message: string;
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportRowError[];
  dryRun: boolean;
}

export interface ExportParams {
  format: 'excel' | 'json';
  entities?: string;
  from?: string;
  to?: string;
}

export async function exportData(params: ExportParams): Promise<void> {
  const res = await apiClient.get('/import-export/export', {
    params,
    responseType: 'blob',
  });

  const contentDisposition = res.headers['content-disposition'] as string | undefined;
  let filename = `vigil-export-${new Date().toISOString().split('T')[0]}`;
  filename += params.format === 'json' ? '.json' : '.xlsx';

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(
  file: File,
  dryRun: boolean,
): Promise<ImportSummary> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await apiClient.post<ImportSummary>(
    `/import-export/import?dryRun=${dryRun}`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return res.data;
}
