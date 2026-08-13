import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthHydration } from '@/components/layout/AuthHydration';
import { LocaleHtmlLang } from '@/components/layout/LocaleHtmlLang';
import { SessionKeepAlive } from '@/components/layout/SessionKeepAlive';

/**
 * Blinkit uses proprietary “Okra” (Gilroy-like geometric sans).
 * Plus Jakarta Sans is a license-safe match for weight/metrics (§19A).
 */
const okra = Plus_Jakarta_Sans({
  variable: '--font-okra',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tapi Grocery — groceries in minutes',
  description: 'Tapi Grocery — single-store quick commerce',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F8CB46',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${okra.variable} h-full`}>
      <body
        className={`${okra.className} min-h-full bg-[var(--background)] font-sans text-[var(--foreground)] antialiased`}
      >
        <AuthHydration>
          <LocaleHtmlLang />
          <SessionKeepAlive />
          {children}
        </AuthHydration>
      </body>
    </html>
  );
}
