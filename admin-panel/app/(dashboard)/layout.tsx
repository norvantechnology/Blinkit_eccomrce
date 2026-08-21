import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AuthHydration from '@/components/layout/AuthHydration';
import SessionKeepAlive from '@/components/layout/SessionKeepAlive';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[var(--background)]">
      <AuthHydration />
      <SessionKeepAlive />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="custom-scrollbar-light flex-1 overflow-y-auto overflow-x-hidden bg-[var(--background)]">
          {/* Full width — no narrow max-width gutters */}
          <div className="w-full px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="animate-fade-in">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
