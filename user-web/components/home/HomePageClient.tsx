'use client';

import { useEffect, useState } from 'react';
import { HomeContent } from '@/components/home/HomeContent';
import { BlinkitPageLoader } from '@/components/layout/BlinkitPageLoader';
import { useLocationStore } from '@/store/locationStore';

/** Desktop: Blinkit green spinner while location resolves; mobile shows home immediately. */
export function HomePageClient() {
  const loading = useLocationStore((s) => s.loading);
  const location = useLocationStore((s) => s.location);
  const [isLaptop, setIsLaptop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1020px)');
    const sync = () => setIsLaptop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (isLaptop && loading && !location) {
    return <BlinkitPageLoader />;
  }

  return <HomeContent />;
}
