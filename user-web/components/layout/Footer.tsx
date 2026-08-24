import Link from 'next/link';
import '@/styles/blinkit-footer.css';

/** Blinkit Useful Links — 3 nested columns (FooterLinks__List) */
const USEFUL_LINKS = [
  ['Blog', 'Privacy', 'Terms', 'FAQs', 'Security', 'Contact'],
  ['Partner', 'Franchise', 'Seller', 'Warehouse', 'Deliver', 'Resources'],
  ['Recipes', 'Bistro', 'District', 'Tapi Support', 'Feeding India'],
];

/** Blinkit Categories — 3 nested columns (hydrated footer) */
const FOOTER_CATEGORIES = [
  [
    'Vegetables & Fruits',
    'Dairy, Bread & Eggs',
    'Atta, Rice & Dal',
    'Bakery & Biscuits',
    'Drinks & Juices',
    'Chicken, Meat & Fish',
    'Oil, Ghee & Masala',
    'Dry Fruits & Cereals',
    'Kitchenware & Appliances',
    'Tea, Coffee & Milk Drinks',
  ],
  [
    'Snacks & Munchies',
    'Bath & Body',
    'Sweets & Chocolates',
    'Beauty & Cosmetics',
    'Personal Care',
    'Baby Care',
    'Home & Lifestyle',
    'Cleaning Essentials',
    'Pet Care',
    'Paan Corner',
  ],
  [
    'Pharma & Wellness',
    'Instant Food',
    'Ice Creams & More',
    'Electronics',
    'Stationery & Games',
    'Print Store',
    'E-Gift Cards',
    'Rakhi Gifts',
  ],
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
  return (
    <div className="bk-footer">
      <footer className="bk-footer__inner">
        <div className="bk-footer__links-grid">
          <div>
            <div className="bk-footer__heading">Useful Links</div>
            <NestedColumns columns={USEFUL_LINKS} />
          </div>

          <div>
            <div className="bk-footer__heading-row">
              <div className="bk-footer__heading">Categories</div>
              <Link href="/" className="bk-footer__see-all">
                see all
              </Link>
            </div>
            <NestedColumns columns={FOOTER_CATEGORIES} />
          </div>
        </div>
      </footer>

      <div className="bk-footer__band">
        <div className="bk-footer__band-grid">
          <div className="bk-footer__band-item bk-footer__band-item--start">
            © Tapi Grocery, 2016-2026
          </div>

          <div className="bk-footer__band-item bk-footer__band-item--center">
            <div className="bk-footer__download-title">Download App</div>
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

      <p className="bk-footer__disclaimer">
        “Tapi Grocery” is owned & managed for this single-store quick-commerce project and is not
        related, linked or interconnected in whatsoever manner or nature to any third-party grocery
        brand or marketplace.
      </p>
    </div>
  );
}
