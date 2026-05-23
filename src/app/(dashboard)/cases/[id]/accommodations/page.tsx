'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getCaseAccommodations,
  upsertAccommodations,
  type HotelLink,
} from '@/lib/api/accommodations';

function AccommodationsContent({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accommodations', caseId],
    queryFn: () => getCaseAccommodations(caseId),
  });

  const [serviceAddress, setServiceAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [hotels, setHotels] = useState<HotelLink[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setServiceAddress(data.serviceAddress ?? '');
    setNotes(data.notes ?? '');
    setHotels((data.hotelLinks as HotelLink[]) ?? []);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () =>
      upsertAccommodations(caseId, {
        serviceAddress: serviceAddress || undefined,
        hotelLinks: hotels,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations', caseId] });
      toast.success('Accommodation page saved.');
    },
    onError: () => toast.error('Failed to save accommodation page.'),
  });

  function addHotel() {
    setHotels([...hotels, { name: '', url: '', address: '', phone: '', rate: '', bereavement: '' }]);
  }

  function updateHotel(index: number, field: keyof HotelLink, value: string) {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    setHotels(updated);
  }

  function removeHotel(index: number) {
    setHotels(hotels.filter((_, i) => i !== index));
  }

  const publicUrl = `${window.location.origin}/accommodations/${caseId}`;

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="serviceAddress">Service Address</Label>
            <Input
              id="serviceAddress"
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              placeholder="123 Main St, Dallas, TX 75201"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Parking notes, shuttle info, etc."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Hotel Options</CardTitle>
          <Button size="sm" variant="outline" onClick={addHotel}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Hotel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {hotels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hotels added yet. Click "Add Hotel" to start.
            </p>
          )}
          {hotels.map((hotel, i) => (
            <div key={i} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Hotel {i + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeHotel(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Hotel Name *</Label>
                  <Input
                    value={hotel.name}
                    onChange={(e) => updateHotel(i, 'name', e.target.value)}
                    placeholder="Hilton Garden Inn"
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Booking URL *</Label>
                  <Input
                    value={hotel.url}
                    onChange={(e) => updateHotel(i, 'url', e.target.value)}
                    placeholder="https://hilton.com/..."
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={hotel.address ?? ''}
                    onChange={(e) => updateHotel(i, 'address', e.target.value)}
                    placeholder="1234 Main St, Dallas, TX"
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={hotel.phone ?? ''}
                    onChange={(e) => updateHotel(i, 'phone', e.target.value)}
                    placeholder="(214) 555-0100"
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rate</Label>
                  <Input
                    value={hotel.rate ?? ''}
                    onChange={(e) => updateHotel(i, 'rate', e.target.value)}
                    placeholder="$129/night"
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bereavement Note</Label>
                  <Input
                    value={hotel.bereavement ?? ''}
                    onChange={(e) => updateHotel(i, 'bereavement', e.target.value)}
                    placeholder="Ask for bereavement rate"
                    className="mt-0.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : data ? 'Update Page' : 'Create Page'}
        </Button>
        {data && (
          <>
            <Button
              variant="outline"
              onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied.'); }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Family Link
            </Button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AccommodationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PageHeader title="Accommodations" />
      <AccommodationsContent caseId={id} />
    </div>
  );
}
