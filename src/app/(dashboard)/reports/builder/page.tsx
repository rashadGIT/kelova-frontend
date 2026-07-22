'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';

const ENTITIES = [
  { id: 'cases', label: 'Cases' },
  { id: 'payments', label: 'Payments' },
  { id: 'tasks', label: 'Tasks' },
];

const FIELDS: Record<string, string[]> = {
  cases: ['Case Number', 'Deceased Name', 'Status', 'Created At', 'Closed At', 'Assigned Staff'],
  payments: ['Invoice Number', 'Amount', 'Status', 'Due Date', 'Paid Date', 'Payment Method'],
  tasks: ['Task Name', 'Assigned To', 'Due Date', 'Status', 'Case Number'],
};

export default function ReportBuilderPage() {
  const [selectedEntity, setSelectedEntity] = useState<string>('cases');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  function toggleField(field: string) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  const availableFields = FIELDS[selectedEntity] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Report Builder" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">1. Select Entity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ENTITIES.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelectedEntity(e.id); setSelectedFields(new Set()); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedEntity === e.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {e.label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Field picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">2. Choose Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableFields.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.has(f)}
                  onChange={() => toggleField(f)}
                  className="rounded"
                />
                {f}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Filter builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">3. Add Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">
              Filter configuration will be available in a future release.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button disabled>Preview</Button>
        <Button variant="outline" disabled>Download CSV</Button>
        <p className="text-xs text-muted-foreground">Select at least one field to enable preview</p>
      </div>
    </div>
  );
}
