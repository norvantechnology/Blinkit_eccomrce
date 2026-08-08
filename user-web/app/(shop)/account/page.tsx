'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Wallet,
  FileText,
  Gift,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

const ITEMS = [
  { href: '/account', label: 'Order History', icon: Clock, soon: true },
  { href: '/account/addresses', label: 'Address Book', icon: MapPin },
  { href: '/account', label: 'Wallet Details', icon: Wallet, soon: true },
  { href: '/account', label: 'My Prescriptions', icon: FileText, soon: true },
  { href: '/account', label: 'E-Gift Cards', icon: Gift, soon: true },
  { href: '/account/settings', label: 'Account Privacy', icon: Shield },
];

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const phone = (user.phone || '').replace(/^\+91/, '') || user.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div>
      {/* Desktop title when sidebar is visible */}
      <h1 className="mb-4 hidden text-[22px] font-extrabold text-[#1f1f1f] lg:block">My account</h1>

      <p className="text-[15px] text-[#888] lg:hidden">{phone}</p>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[#999] lg:mt-0">
        Your Information
      </p>

      <ul className="mt-2">
        {ITEMS.map(({ href, label, icon: Icon, soon }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex items-center gap-3 border-b border-[#f5f5f5] py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#555]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[15px] font-medium text-[#1f1f1f]">{label}</span>
              {soon ? (
                <span className="text-[10px] font-semibold uppercase text-[#bbb]">Soon</span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 py-3.5 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#555]">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-medium text-[#1f1f1f]">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
