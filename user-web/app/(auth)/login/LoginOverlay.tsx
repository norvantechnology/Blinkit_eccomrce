'use client';

import { useSearchParams } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';

export default function LoginOverlay() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  return <LoginModal redirectTo={redirect} onCloseHref="/" />;
}
