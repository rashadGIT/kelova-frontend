import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AuthInitializer } from '@/components/auth/auth-initializer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('access_token')) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthInitializer />
      {/* Desktop sidebar — fixed left rail */}
      <Sidebar />

      {/* Main content area — offset on md+ to account for sidebar */}
      <div className="flex flex-col md:pl-56">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
