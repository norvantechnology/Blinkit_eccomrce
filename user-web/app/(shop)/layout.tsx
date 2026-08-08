import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocationPickerSheet } from '@/components/location/LocationPickerSheet';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <LocationPickerSheet />
    </div>
  );
}
