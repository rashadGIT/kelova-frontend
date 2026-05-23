'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getShowroomProducts } from '@/lib/api/case-extras';

export default function ShowroomPage({ params }: { params: { id: string } }) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['showroom-products'],
    queryFn: getShowroomProducts,
  });

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      <PageHeader title="3D Product Showroom" />

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        3D models require WebGL support. Ensure your browser supports WebGL before viewing.
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : !products || products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No products available in showroom</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className={`rounded-lg border-2 cursor-pointer transition-colors hover:border-primary ${
                selectedProductId === p.id ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <div className="h-28 bg-muted rounded-t-lg flex items-center justify-center text-muted-foreground text-xs">
                {p.previewImage ? (
                  <img src={p.previewImage} alt={p.name} className="h-full w-full object-cover rounded-t-lg" />
                ) : (
                  'No preview'
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-xs"
                  onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); }}
                >
                  View in 3D
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedProduct.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
              3D model viewer — WebGL canvas will render here
            </div>
            <div className="mt-4 flex gap-3">
              <Button>Add to Case</Button>
              <Button variant="outline">Request Quote</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
