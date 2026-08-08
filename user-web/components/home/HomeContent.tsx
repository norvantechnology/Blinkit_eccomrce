import Link from 'next/link';

/** Blinkit homepage category labels (screenshot parity). */
export const HOME_CATEGORIES = [
  { name: 'Paan Corner', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop', bg: '#fff3e0' },
  { name: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&fit=crop', bg: '#e3f2fd' },
  { name: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop', bg: '#e8f5e9' },
  { name: 'Cold Drinks & Juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop', bg: '#e1f5fe' },
  { name: 'Snacks & Munchies', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee7b2b5?w=200&h=200&fit=crop', bg: '#fff8e1' },
  { name: 'Breakfast & Instant Food', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&h=200&fit=crop', bg: '#fce4ec' },
  { name: 'Sweet Tooth', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop', bg: '#f3e5f5' },
  { name: 'Bakery & Biscuits', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop', bg: '#fff3e0' },
  { name: 'Tea, Coffee & Milk Drinks', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop', bg: '#efebe9' },
  { name: 'Atta, Rice & Dal', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop', bg: '#fbe9e7' },
  { name: 'Masala, Oil & More', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop', bg: '#fff8e1' },
  { name: 'Sauces & Spreads', image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200&h=200&fit=crop', bg: '#ffebee' },
  { name: 'Chicken, Meat & Fish', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop', bg: '#fce4ec' },
  { name: 'Organic & Healthy Living', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop', bg: '#e8f5e9' },
  { name: 'Baby Care', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop', bg: '#e3f2fd' },
  { name: 'Pharma & Wellness', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', bg: '#e0f7fa' },
  { name: 'Cleaning Essentials', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&h=200&fit=crop', bg: '#e8eaf6' },
  { name: 'Home & Office', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=200&h=200&fit=crop', bg: '#f3e5f5' },
  { name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop', bg: '#e0f2f1' },
  { name: 'Pet Care', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop', bg: '#fff3e0' },
] as const;

export function HomeContent() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-8 pt-3 lg:px-4 lg:pt-4">
      {/* Hero — Blinkit “Stock up on daily essentials” */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1B7A3D]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.12),_transparent_55%)]" />
        <div className="relative grid items-center gap-4 p-5 sm:p-8 lg:grid-cols-2 lg:p-10">
          <div className="max-w-md">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Stock up on daily essentials
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">
              Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more
            </p>
            <Link
              href="/#categories"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#1f1f1f] transition hover:bg-white/95 active:scale-[0.98]"
            >
              Shop Now
            </Link>
          </div>
          <div className="relative mx-auto h-40 w-full max-w-md overflow-hidden rounded-xl sm:h-52 lg:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop"
              alt="Fresh groceries"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Secondary promo row — stack on mobile like Blinkit app */}
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: 'Pharmacy at your doorstep!',
            sub: 'Cough syrups, pain relief sprays & more',
            bg: 'bg-[#0D7377]',
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=240&fit=crop',
          },
          {
            title: 'Pet care supplies at your door',
            sub: 'Food, treats, toys & more',
            bg: 'bg-[#F5C518]',
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop',
            dark: true,
          },
          {
            title: 'No time for a diaper run?',
            sub: 'Get baby care essentials',
            bg: 'bg-[#9B8EC2]',
            image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=240&fit=crop',
          },
        ].map((banner) => (
          <div
            key={banner.title}
            className={`relative min-h-[148px] overflow-hidden rounded-2xl ${banner.bg} p-4 sm:min-h-[160px]`}
          >
            <div className="relative z-10 max-w-[58%]">
              <h2
                className={`text-base font-extrabold leading-snug sm:text-lg ${banner.dark ? 'text-[#1f1f1f]' : 'text-white'}`}
              >
                {banner.title}
              </h2>
              <p className={`mt-1 text-xs leading-snug ${banner.dark ? 'text-[#1f1f1f]/80' : 'text-white/85'}`}>
                {banner.sub}
              </p>
              <button
                type="button"
                className={`mt-3 inline-flex h-8 items-center rounded-full px-3.5 text-xs font-bold ${
                  banner.dark ? 'bg-[#1f1f1f] text-white' : 'bg-white text-[#1f1f1f]'
                }`}
              >
                Order Now
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image}
              alt=""
              className="absolute bottom-0 right-0 h-[70%] w-[45%] object-cover object-left opacity-95"
            />
          </div>
        ))}
      </section>

      {/* Category grid — 4 cols mobile / 10 desktop */}
      <section id="categories" className="mt-8 scroll-mt-28">
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 lg:gap-x-3">
          {HOME_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              title="Products open in Milestone 2"
              className="group flex flex-col items-center text-center"
            >
              <span
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl"
                style={{ backgroundColor: cat.bg }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-[78%] w-[78%] object-contain transition group-hover:scale-105"
                  loading="lazy"
                />
              </span>
              <span className="mt-2 line-clamp-2 min-h-[2.4em] text-[11px] font-semibold leading-tight text-[#1f1f1f] sm:text-xs">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
