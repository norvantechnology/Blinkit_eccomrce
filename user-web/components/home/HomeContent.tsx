import Link from 'next/link';

/** Blinkit homepage category tiles — inner rounded photo on pastel square. */
export const HOME_CATEGORIES = [
  { name: 'Paan Corner', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=240&h=240&fit=crop&q=80', bg: '#FFF4E0' },
  { name: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=240&h=240&fit=crop&q=80', bg: '#E8F3FC' },
  { name: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=240&h=240&fit=crop&q=80', bg: '#EAF7EA' },
  { name: 'Cold Drinks & Juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=240&h=240&fit=crop&q=80', bg: '#E6F6FB' },
  { name: 'Snacks & Munchies', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=240&h=240&fit=crop&q=80', bg: '#FFF6E4' },
  { name: 'Breakfast & Instant Food', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=240&h=240&fit=crop&q=80', bg: '#FDECF1' },
  { name: 'Sweet Tooth', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=240&h=240&fit=crop&q=80', bg: '#F4EAF8' },
  { name: 'Bakery & Biscuits', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=240&h=240&fit=crop&q=80', bg: '#FFF3E4' },
  { name: 'Tea, Coffee & Milk Drinks', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&h=240&fit=crop&q=80', bg: '#F3EEEA' },
  { name: 'Atta, Rice & Dal', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=240&h=240&fit=crop&q=80', bg: '#FBEDE8' },
  { name: 'Masala, Oil & More', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=240&h=240&fit=crop&q=80', bg: '#FFF7E3' },
  { name: 'Sauces & Spreads', image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=240&h=240&fit=crop&q=80', bg: '#FDECEC' },
  { name: 'Chicken, Meat & Fish', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=240&h=240&fit=crop&q=80', bg: '#FDE8EF' },
  { name: 'Organic & Healthy Living', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=240&h=240&fit=crop&q=80', bg: '#EAF6EA' },
  { name: 'Baby Care', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=240&h=240&fit=crop&q=80', bg: '#E8F1FC' },
  { name: 'Pharma & Wellness', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=240&h=240&fit=crop&q=80', bg: '#E4F6F8' },
  { name: 'Cleaning Essentials', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=240&h=240&fit=crop&q=80', bg: '#EEF0F8' },
  { name: 'Home & Office', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=240&h=240&fit=crop&q=80', bg: '#F3EAF8' },
  { name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=240&h=240&fit=crop&q=80', bg: '#E6F4F2' },
  { name: 'Pet Care', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=240&h=240&fit=crop&q=80', bg: '#FFF3E0' },
] as const;

const PROMO_BANNERS = [
  {
    title: 'Pharmacy at your doorstep!',
    sub: 'Cough syrups, pain relief sprays & more',
    bg: '#0D7377',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=480&h=360&fit=crop&q=80',
    dark: false,
  },
  {
    title: 'Pet care supplies at your door',
    sub: 'Food, treats, toys & more',
    bg: '#F5C518',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=480&h=360&fit=crop&q=80',
    dark: true,
  },
  {
    title: 'No time for a diaper run?',
    sub: 'Get baby care essentials',
    bg: '#9B8EC2',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=480&h=360&fit=crop&q=80',
    dark: false,
  },
] as const;

export function HomeContent() {
  return (
    <div className="bk-page bk-page--home">
      <section className="bk-home__hero">
        <div className="bk-home__hero-inner">
          <div className="min-w-0 flex-1 lg:max-w-[46%]">
            <h1 className="bk-home__hero-title">Stock up on daily essentials</h1>
            <p className="bk-home__hero-sub">
              Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more
            </p>
            <Link href="/#categories" className="bk-home__hero-cta">
              Shop Now
            </Link>
          </div>
          <div className="w-full shrink-0 overflow-hidden rounded-2xl lg:w-[48%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=960&h=540&fit=crop&q=80"
              alt="Fresh fruits and vegetables"
              className="h-[148px] w-full object-cover sm:h-[200px] lg:h-[220px]"
            />
          </div>
        </div>
      </section>

      <section className="bk-home__promos no-scrollbar">
        {PROMO_BANNERS.map((banner) => (
          <article
            key={banner.title}
            className="bk-home__promo"
            style={{ backgroundColor: banner.bg }}
          >
            <div className="relative z-10 flex h-full w-[58%] flex-col justify-center p-4 pr-2 sm:p-5">
              <h2
                className={`text-[15px] font-extrabold leading-snug sm:text-[17px] ${
                  banner.dark ? 'text-[#1f1f1f]' : 'text-white'
                }`}
              >
                {banner.title}
              </h2>
              <p
                className={`mt-1 line-clamp-2 text-[11px] leading-snug sm:text-[12px] ${
                  banner.dark ? 'text-[#1f1f1f]/75' : 'text-white/85'
                }`}
              >
                {banner.sub}
              </p>
              <span
                className={`mt-3 inline-flex h-7 w-fit items-center rounded-full px-3 text-[11px] font-bold sm:h-8 sm:px-3.5 sm:text-xs ${
                  banner.dark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#1f1f1f]'
                }`}
              >
                Order Now
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image}
              alt=""
              className="absolute bottom-0 right-0 h-full w-[46%] object-cover object-center"
            />
          </article>
        ))}
      </section>

      <section id="categories" className="bk-home__cats scroll-mt-24">
        {HOME_CATEGORIES.map((cat) => (
          <button key={cat.name} type="button" title="Products open in Milestone 2" className="bk-home__cat">
            <span className="bk-home__cat-tile" style={{ backgroundColor: cat.bg }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.image} alt={cat.name} loading="lazy" />
            </span>
            <span className="bk-home__cat-label">{cat.name}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
