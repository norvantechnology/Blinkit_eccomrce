'use client';

import { Lottie } from 'lottie-react';
import { useEffect, useState } from 'react';

const LOTTIE_SRC = '/blinkit-parity/login/login_4.0_product_animation.json';

/** Blinkit mobile login hero — login_4.0_product_animation (top 50%). */
export function LoginLottie() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1020px)');
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!enabled) return null;

  return (
    <Lottie
      src={LOTTIE_SRC}
      loop
      autoplay
      className="login__lottie"
      aria-hidden
      rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
    />
  );
}
