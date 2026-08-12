'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** §19A.2 — My Addresses is the primary account landing. */
export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/addresses');
  }, [router]);

  return (
    <div className="bg-white px-4 py-16 text-center text-sm text-[#999]">Loading…</div>
  );
}
