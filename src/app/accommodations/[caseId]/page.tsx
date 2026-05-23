import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { HotelLink, AccommodationPage } from '@/lib/api/accommodations';
import { ExternalLink, MapPin, Phone } from 'lucide-react';

async function fetchAccommodations(caseId: string): Promise<AccommodationPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/accommodations/${caseId}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string }>;
}): Promise<Metadata> {
  const { caseId } = await params;
  const page = await fetchAccommodations(caseId);
  const name = page?.case?.deceasedName ?? 'Service';
  return { title: `Accommodations — ${name}` };
}

export default async function PublicAccommodationsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const page = await fetchAccommodations(caseId);
  if (!page) notFound();

  const hotels = (page.hotelLinks ?? []) as HotelLink[];
  const deceasedName = page.case?.deceasedName;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Accommodation Information
          </p>
          {deceasedName && (
            <h1 className="text-2xl font-semibold text-foreground">
              Service for {deceasedName}
            </h1>
          )}
          {page.serviceAddress && (
            <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{page.serviceAddress}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {page.notes && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-foreground whitespace-pre-line">{page.notes}</p>
          </div>
        )}

        {hotels.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4">Nearby Hotels</h2>
            <div className="space-y-3">
              {hotels
                .filter((h) => h.name)
                .map((hotel, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-foreground">{hotel.name}</h3>
                      {hotel.url && (
                        <a
                          href={hotel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Book
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {hotel.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{hotel.address}</span>
                        </div>
                      )}
                      {hotel.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <a href={`tel:${hotel.phone}`} className="hover:underline">
                            {hotel.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {hotel.rate && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {hotel.rate}
                        </span>
                      )}
                      {hotel.bereavement && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {hotel.bereavement}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {hotels.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Hotel information will be added soon.
          </p>
        )}
      </div>
    </div>
  );
}
