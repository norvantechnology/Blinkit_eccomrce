'use client';

import { useEffect, useLayoutEffect } from 'react';
import { getStoredUser } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function AuthHydration() {
  const setUser = useAuthStore((s) => s.setUser);

  useIsomorphicLayoutEffect(() => {
    const user = getStoredUser();
    if (user) setUser(user);
  }, [setUser]);

  return null;
}
