'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/useI18n';
import '@/styles/blinkit-footer.css';

/** Blinkit Useful Links - 3 nested columns (FooterLinks__List) */
const USEFUL_LINKS = [
  ['Blog', 'Privacy', 'Terms', 'FAQs', 'Security', 'Contact'],
  ['Partner', 'Franchise', 'Seller', 'Warehouse', 'Deliver', 'Resources'],
  ['Recipes', 'Bistro', 'District', 'Tapi Support', 'Community'],
];

/** Blinkit mobile Categories - 2-column flow (column-count) */
const FOOTER_CATEGORIES = [
  'Bath & Body',
  'Hair',
  'Skin & Face',
  'Beauty & Cosmetics',
  'Feminine Hygiene',
  'Baby Care',
  'Health & Pharma',
  'Sexual Wellness',
  'Vegetables & Fruits',
  'Atta, Rice & Dal',
  'Oil, Ghee & Masala',
  'Dairy, Bread & Eggs',
  'Bakery & Biscuits',
  'Dry Fruits & Cereals',
  'Chicken, Meat & Fish',
  'Kitchenware & Appliances',
  'Chips & Namkeen',
  'Sweets & Chocolates',
  'Drinks & Juices',
  'Tea, Coffee & Milk Drinks',
  'Instant Food',
  'Sauces & Spreads',
  'Paan Corner',
  'Ice Creams & More',
  'Home & Lifestyle',
  'Cleaners & Repellents',
  'Electronics',
  'Stationery & Games',
  'Print Store',
  'E-Gift Cards',
  'Rakhi Gifts',
];

const SOCIAL = [
  { name: 'Facebook', src: '/blinkit-parity/icons/footer/facebook.svg' },
  { name: 'X', src: '/blinkit-parity/icons/footer/x.svg' },
  { name: 'Instagram', src: '/blinkit-parity/icons/footer/instagram.svg' },
  { name: 'LinkedIn', src: '/blinkit-parity/icons/footer/linkedin.svg' },
  { name: 'Threads', src: '/blinkit-parity/icons/footer/threads.svg' },
] as const;

function NestedColumns({ columns }: { columns: string[][] }) {
  return (
    <ul className="bk-footer__cols">
      {columns.map((col) => (
        <li key={col[0]} className="bk-footer__item">
          <ul className="bk-footer__col">
            {col.map((item) => (
              <li key={item} className="bk-footer__item">
                <span className="bk-footer__link">{item}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className={cn('bk-footer', open && 'is-open')}>
      <div className="bk-footer__brand">
        <div className="bk-footer__brand-title">
          <span>{t('footer.slogan')}</span>
          <span className="bk-footer__brand-heart-wrap" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blinkit-parity/icons/footer/heart.svg"
              alt=""
              width={28}
              height={28}
              data-pf="reset"
              className="spicy-tailwind tw-w-full tw-h-full tw-transition-opacity"
              style={{ transform: 'scale(1)' }}
            />
          </span>
        </div>
        <div className="bk-footer__brand-rule" aria-hidden />
        <div className="bk-footer__brand-mark" data-pf="reset">
          tapi grocery
        </div>
      </div>

      <button
        type="button"
        className="bk-footer__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t('footer.sloganToggle')}</span>
        <span className={cn('bk-footer__plus', open && 'is-open')} aria-hidden />
      </button>

      <div className="bk-footer__panel">
        <footer className="bk-footer__inner">
          <div className="bk-footer__links-grid hyzNyz">
            <div>
              <div className="bk-footer__heading aonOx">{t('footer.usefulLinks')}</div>
              <NestedColumns columns={USEFUL_LINKS} />
            </div>

            <div>
              <div className="bk-footer__heading-row">
                <div className="bk-footer__heading aonOx">{t('footer.categories')}</div>
                <Link href="/" className="bk-footer__see-all">
                  {t('footer.seeAll')}
                </Link>
              </div>
              <ul className="bk-footer__cats">
                {FOOTER_CATEGORIES.map((item) => (
                  <li key={item} className="bk-footer__item">
                    <span className="bk-footer__link">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </footer>

        <div className="bk-footer__band">
          <div className="bk-footer__band-grid">
            <div className="bk-footer__band-item bk-footer__band-item--start">
              {t('footer.copyright')}
            </div>

            <div className="bk-footer__band-item bk-footer__band-item--center">
              <div className="bk-footer__download-title">{t('footer.downloadApp')}</div>
              <div className="bk-footer__flex bk-footer__flex--badges">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="bk-footer__badge"
                  src="/blinkit-parity/icons/footer/app-store.svg"
                  alt="App Store"
                  width={92}
                  height={30}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="bk-footer__badge"
                  src="/blinkit-parity/icons/footer/google-play.svg"
                  alt="Google Play"
                  width={92}
                  height={30}
                />
              </div>
            </div>

            <div className="bk-footer__band-item bk-footer__band-item--end">
              <div className="bk-footer__flex bk-footer__flex--social">
                {SOCIAL.map((s) => (
                  <span key={s.name} className="bk-footer__social" aria-label={s.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt="" width={40} height={40} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="bk-footer__disclaimer">{t('footer.disclaimer')}</p>
      </div>
    </div>
  );
}
