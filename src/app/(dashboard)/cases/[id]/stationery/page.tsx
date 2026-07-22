'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getStationeryTemplates } from '@/lib/api/case-extras';

export default function StationeryPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['stationery-templates'],
    queryFn: getStationeryTemplates,
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      <PageHeader title="Stationery" />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : !templates || templates.length === 0 ? (
        <p className="text-muted-foreground text-sm">No stationery templates available.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplateId(t.id)}
              className={`rounded-lg border-2 p-4 text-left transition-colors hover:border-primary ${
                selectedTemplateId === t.id ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <div className="h-16 rounded bg-muted mb-3 flex items-center justify-center text-xs text-muted-foreground">
                Preview
              </div>
              <p className="text-sm font-medium truncate">{t.name}</p>
              <Badge variant="outline" className="text-xs mt-1">{t.category}</Badge>
            </button>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedTemplate.name} — Field Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deceased Name</label>
              <Input placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Script Text</label>
              <Input placeholder="In loving memory..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quantity</label>
              <Input type="number" placeholder="50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vendor</label>
              <Input placeholder="Printing vendor" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <Button>Generate Proof</Button>
              <Button variant="outline">Order</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
