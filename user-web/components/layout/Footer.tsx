const USEFUL_LINKS = [
  ['Blog', 'Privacy', 'Terms', 'FAQs', 'Security', 'Contact'],
  ['Partner', 'Franchise', 'Seller', 'Warehouse', 'Deliver', 'Resources'],
  ['Recipes', 'Bistro', 'District', 'Tapi Support', 'Feeding India'],
];

const FOOTER_CATEGORIES = [
  [
    'Bath & Body',
    'Beauty & Cosmetics',
    'Health & Pharma',
    'Atta, Rice & Dal',
    'Bakery & Biscuits',
    'Kitchenware & Appliances',
    'Drinks & Juices',
    'Sauces & Spreads',
    'Home & Lifestyle',
    'Stationery & Games',
  ],
  [
    'Hair',
    'Feminine Hygiene',
    'Oil, Ghee & Masala',
    'Dry Fruits & Cereals',
    'Chips & Namkeen',
    'Tea, Coffee & Milk Drinks',
    'Paan Corner',
    'Cleaners & Repellents',
    'Personal Care',
    'Pet Care',
  ],
  [
    'Skin & Face',
    'Baby Care',
    'Vegetables & Fruits',
    'Dairy, Bread & Eggs',
    'Chicken, Meat & Fish',
    'Sweets & Chocolates',
    'Instant Food',
    'Ice Creams & More',
    'Electronics',
    'E-Gift Cards',
  ],
];

function LinkColumn({ items }: { items: string[] }) {
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {items.map((item) => (
        <li key={item}>
          <span className="cursor-default text-[13px] leading-snug text-[#666] transition hover:text-[#1f1f1f]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-white">
      <div className="mx-auto max-w-[1360px] px-4 pt-10 pb-6 lg:px-4">
        {/* Useful Links | Categories — Blinkit column alignment */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section>
            <h3 className="text-[18px] font-extrabold tracking-tight text-[#1f1f1f]">Useful Links</h3>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3 sm:gap-x-10">
              {USEFUL_LINKS.map((col) => (
                <LinkColumn key={col[0]} items={col} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#1f1f1f]">Categories</h3>
              <button type="button" className="text-[13px] font-semibold text-[var(--cart-green)]">
                see all
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3 sm:gap-x-8">
              {FOOTER_CATEGORIES.map((col) => (
                <LinkColumn key={col[0]} items={col} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom utility bar */}
      <div className="border-t border-[#eee] bg-[#f8f8f8]">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-4">
          <p className="shrink-0 text-[12px] text-[#666]">© Tapi Grocery, 2016-2026</p>

          <div className="flex flex-wrap items-center gap-2.5 sm:justify-center">
            <span className="text-[13px] font-bold text-[#1f1f1f]">Download App</span>
            <span className="inline-flex h-8 items-center rounded-md bg-black px-3 text-[11px] font-medium text-white">
              App Store
            </span>
            <span className="inline-flex h-8 items-center rounded-md bg-black px-3 text-[11px] font-medium text-white">
              Google Play
            </span>
          </div>

          <div className="flex shrink-0 gap-2 sm:justify-end">
            {['f', 'x', 'ig', 'in', 'th'].map((s) => (
              <span
                key={s}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-[10px] font-bold uppercase text-white"
                aria-hidden
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-4 py-5 lg:px-4">
        <p className="max-w-5xl text-[11px] leading-relaxed text-[#999]">
          “Tapi Grocery” is owned & managed for this single-store quick-commerce project and is not
          related, linked or interconnected in whatsoever manner or nature to any third-party grocery
          brand or marketplace.
        </p>
      </div>
    </footer>
  );
}
