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
        <main className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden bg-[var(--background)] p-3 sm:p-5 lg:p-6">
          <div className="mx-auto min-h-full max-w-7xl rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 shadow-inner sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
