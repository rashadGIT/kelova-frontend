import { notFound } from 'next/navigation';
import { PayLinkView } from './pay-link-view';

interface InstallmentLinkData {
  token: string;
  installmentNumber: number;
  amount: string | number;
  dueDate: string | null;
  deceasedName: string | null;
  alreadyPaid: boolean;
}

async function fetchLinkData(token: string): Promise<InstallmentLinkData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/payments/link/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<InstallmentLinkData>;
  } catch {
    return null;
  }
}

export default async function PayLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { token } = await params;
  const { success } = await searchParams;
  const data = await fetchLinkData(token);

  if (!data) notFound();

  return <PayLinkView data={data} token={token} success={success === 'true'} />;
}
