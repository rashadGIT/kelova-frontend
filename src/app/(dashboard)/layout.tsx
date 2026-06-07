import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AuthInitializer } from '@/components/auth/auth-initializer';
import { MessagingProvider } from '@/components/messaging/messaging-provider';
// import { TrialingBanner } from '@/components/billing/trialing-banner';
// import { serverFetch } from '@/lib/api/server';

// async function getSubscriptionStatus(): Promise<string> {
//   try {
//     const data = await serverFetch<{ status: string }>('/billing/subscription');
//     return data.status;
//   } catch {
//     return 'active'; // fail open — don't block the layout
//   }
// }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('access_token')) {
    redirect('/login');
  }

  // const subscriptionStatus = await getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-background">
      <AuthInitializer />
      {/* <TrialingBanner status={subscriptionStatus} /> */}
      <MessagingProvider>
        {/* Desktop sidebar — fixed left rail */}
        <Sidebar />

        {/* Main content area — offset on md+ to account for sidebar */}
        <div className="flex flex-col md:pl-56">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">{children}</main>
        </div>
        <MobileNav />
      </MessagingProvider>
    </div>
  );
}
