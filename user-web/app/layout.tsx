import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthHydration } from '@/components/layout/AuthHydration';
import { LocaleHtmlLang } from '@/components/layout/LocaleHtmlLang';
import { SessionKeepAlive } from '@/components/layout/SessionKeepAlive';

/**
 * Site font = Blinkit Okra (woff2 in /blinkit-parity/fonts/okra via okra-fonts.css).
 * Do not apply a Google font className on <body> — it overrides Okra.
 */

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
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[var(--background)] antialiased">
        <AuthHydration>
          <LocaleHtmlLang />
          <SessionKeepAlive />
          {children}
        </AuthHydration>
      </body>
    </html>
  );
}
