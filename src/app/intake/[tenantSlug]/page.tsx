import { IntakeForm } from '@/components/intake/intake-form';

interface IntakePageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <IntakeForm tenantSlug={tenantSlug} />
        </div>
        <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
          Your information is kept private and shared only with the funeral home.
          All data is transmitted securely.
        </p>
      </div>
    </div>
  );
}
