'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { exportData, importData, ImportSummary } from '@/lib/api/import-export';

interface EntityOption {
  key: string;
  label: string;
}

const ENTITIES: EntityOption[] = [
  { key: 'cases', label: 'Cases' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'price_list', label: 'Price List' },
  { key: 'vendors', label: 'Vendors' },
];

type EntityKey = string;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataSettingsPage() {
  // ── Export state ─────────────────────────────────────────────────────────
  const [format, setFormat] = useState<'excel' | 'json'>('excel');
  const [selectedEntities, setSelectedEntities] = useState<Set<EntityKey>>(
    new Set(['cases', 'contacts', 'tasks', 'price_list', 'vendors']),
  );
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  // ── Import state ──────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: () => importData(file!, dryRun),
    onSuccess: (data) => {
      setSummary(data);
      if (data.dryRun) {
        toast.info(
          `Preview complete — ${data.created} to create, ${data.updated} to update, ${data.skipped} skipped.`,
        );
      } else {
        toast.success(
          `Import complete — ${data.created} created, ${data.updated} updated.`,
        );
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Import failed. Please check your file and try again.');
    },
  });

  function toggleEntity(key: EntityKey) {
    setSelectedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleExport() {
    const active = [...selectedEntities];
    if (active.length === 0) {
      toast.error('Select at least one entity to export.');
      return;
    }
    setExporting(true);
    try {
      await exportData({
        format,
        entities: active.join(','),
        from: fromDate || undefined,
        to: toDate || undefined,
      });
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSummary(null);
  }

  function clearFile() {
    setFile(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data Import & Export</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export your data for reporting or migration, or import records from another system.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Export Card ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your cases, contacts, and tasks as Excel or JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Format</Label>
              <div className="flex gap-4">
                {(['excel', 'json'] as const).map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="accent-foreground"
                    />
                    <span className="text-sm capitalize">
                      {f === 'excel' ? 'Excel (.xlsx)' : 'JSON'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Entities */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Include</Label>
              <div className="space-y-2">
                {ENTITIES.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`entity-${key}`}
                      checked={selectedEntities.has(key)}
                      onCheckedChange={() => toggleEntity(key)}
                    />
                    <Label
                      htmlFor={`entity-${key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date Range{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="From"
                />
                <span className="text-muted-foreground text-sm shrink-0">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="To"
                />
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting || selectedEntities.size === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Preparing download…' : 'Download'}
            </Button>
          </CardContent>
        </Card>

        {/* ── Import Card ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload an Excel (.xlsx) or JSON file to bulk-import records. Use
              Preview mode first to check for errors before committing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* File picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">File</Label>
              {file ? (
                <div className="flex items-center gap-3 rounded-md border border-input bg-muted/40 px-3 py-2">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="import-file"
                  className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/20 px-4 py-8 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Click to select a file
                    <br />
                    <span className="text-xs">.xlsx or .json, up to 10 MB</span>
                  </span>
                </label>
              )}
              <input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".xlsx,.json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            {/* Dry run toggle */}
            <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
              <div>
                <p className="text-sm font-medium">Preview mode</p>
                <p className="text-xs text-muted-foreground">
                  Validate without writing any changes
                </p>
              </div>
              <Switch
                checked={dryRun}
                onCheckedChange={setDryRun}
                aria-label="Toggle preview mode"
              />
            </div>

            <Button
              onClick={() => importMutation.mutate()}
              disabled={!file || importMutation.isPending}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending
                ? 'Importing…'
                : dryRun
                  ? 'Preview Import'
                  : 'Import File'}
            </Button>

            {/* Results */}
            {summary && (
              <div className="space-y-3">
                {summary.dryRun && (
                  <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Preview only — no records were changed
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Created', value: summary.created, color: 'text-emerald-600' },
                    { label: 'Updated', value: summary.updated, color: 'text-blue-600' },
                    { label: 'Skipped', value: summary.skipped, color: 'text-amber-600' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-md border border-input bg-muted/30 py-2"
                    >
                      <p className={`text-lg font-semibold ${color}`}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {summary.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {summary.errors.length} row error
                      {summary.errors.length !== 1 ? 's' : ''}
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 divide-y divide-destructive/10">
                      {summary.errors.map((err, i) => (
                        <div key={i} className="px-3 py-2 text-xs">
                          <span className="font-medium text-muted-foreground">
                            Row {err.row} · {err.entity}
                            {err.field ? ` · ${err.field}` : ''}
                          </span>
                          <p className="text-destructive mt-0.5">{err.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.errors.length === 0 && (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    No errors found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
