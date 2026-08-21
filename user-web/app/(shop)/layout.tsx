'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocationPickerSheet } from '@/components/location/LocationPickerSheet';

/** Blinkit account/orders pages do not show the site footer. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname.startsWith('/account');

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter ? (
        <div className="bk-footer-host">
          <Footer />
        </div>
      ) : null}
      <LocationPickerSheet />
    </div>
  );
}
