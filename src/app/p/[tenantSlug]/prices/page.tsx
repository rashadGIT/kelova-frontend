import { publicApiClient } from '@/lib/api/public-client';

const CATEGORY_LABELS: Record<string, string> = {
  professional_services: 'Professional Services',
  facilities: 'Facilities & Equipment',
  vehicles: 'Vehicles',
  merchandise: 'Merchandise',
  other: 'Other Services',
};

const CATEGORY_ORDER = [
  'professional_services',
  'facilities',
  'vehicles',
  'merchandise',
  'other',
];

interface PriceItem {
  id: string;
  name: string;
  price: number;
  taxable: boolean;
}

interface PublicPriceListResponse {
  tenantName: string;
  effectiveDate: string;
  items: Record<string, PriceItem[]>;
}

async function getPriceList(slug: string): Promise<PublicPriceListResponse> {
  const res = await publicApiClient.get<PublicPriceListResponse>(`/p/${slug}/prices`);
  return res.data;
}

export default async function PublicPricesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  let data: PublicPriceListResponse | null = null;
  let error: string | null = null;

  try {
    data = await getPriceList(tenantSlug);
  } catch {
    error = 'Price list not available.';
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error ?? 'Not found.'}</p>
      </div>
    );
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => data!.items[c]?.length);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 print:py-4">
      {/* Header */}
      <div className="text-center mb-8 print:mb-6">
        <h1 className="text-3xl font-bold">{data.tenantName}</h1>
        <h2 className="text-xl font-semibold mt-2">General Price List</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Effective: {new Date(data.effectiveDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* FTC notice */}
      <div className="border rounded-md p-4 mb-8 bg-muted/30 text-sm print:mb-4">
        <p className="font-medium mb-1">Important Notice</p>
        <p className="text-muted-foreground">
          This General Price List is provided in accordance with the FTC Funeral Rule (16 C.F.R. Part 453).
          You are not required to purchase any package — you may select only the items you want.
          The prices listed are effective as of the date shown above and are subject to change.
        </p>
      </div>

      {/* Price table */}
      {sortedCategories.map((cat) => (
        <section key={cat} className="mb-8 print:mb-6">
          <h3 className="text-base font-semibold border-b pb-2 mb-3">
            {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {data!.items[cat].map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    {item.name}
                    {item.taxable && (
                      <span className="ml-1 text-xs text-muted-foreground">*</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    ${item.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {/* Taxable note */}
      <p className="text-xs text-muted-foreground mb-8">
        * Taxable items. Applicable sales tax will be added at time of arrangement.
      </p>

      {/* Print button — hidden when printing */}
      <div className="text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* FTC footer */}
      <footer className="mt-12 pt-6 border-t text-xs text-muted-foreground print:mt-6">
        <p>
          Prices are subject to change without notice. You have the right to select only the items you want.
          If you select certain items, certain other items may be required — we will inform you prior to any such requirement.
          Discounts or package pricing may be available; ask your arranger for details.
        </p>
        <p className="mt-2">
          This price list is provided pursuant to the Federal Trade Commission Funeral Rule, 16 C.F.R. Part 453.
        </p>
      </footer>

      <style>{`
        @media print {
          body { font-size: 11pt; }
          main { max-width: 100%; }
        }
      `}</style>
    </main>
  );
}
