'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

/** Blinkit mobile login hero — login_4.0_product_animation (top 50%). */
export function LoginLottie() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1020px)');
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetch('/blinkit-parity/login/login_4.0_product_animation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnimationData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  if (!animationData) {
    return <div className="login__lottie login__lottie--placeholder" aria-hidden />;
  }

  return (
    <div className="login__lottie" aria-hidden>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
