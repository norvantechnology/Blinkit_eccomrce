import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomeContent } from '@/components/home/HomeContent';
import LoginOverlay from './LoginOverlay';

export default function LoginRoute() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HomeContent />
      </main>
      <div className="bk-footer-host">
        <Footer />
      </div>
      <Suspense fallback={null}>
        <LoginOverlay />
      </Suspense>
    </div>
  );
}
