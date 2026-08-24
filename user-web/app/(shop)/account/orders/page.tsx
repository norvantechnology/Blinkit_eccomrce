'use client';

/**
 * Blinkit My Orders - cards match live UI (check, status, ₹·date, thumbs).
 * Demo list until user-orders API is wired.
 */

type OrderItem = {
  id: string;
  image: string;
  name: string;
};

type OrderCard = {
  id: string;
  statusTitle: string;
  amount: number;
  dateLabel: string;
  items: OrderItem[];
};

const DEMO_ORDERS: OrderCard[] = [
  {
    id: '1',
    statusTitle: 'Arrived in 9 minutes',
    amount: 150,
    dateLabel: '18 Apr 2025',
    items: [
      {
        id: 'a1',
        name: 'Milk',
        image:
          'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=96&h=96&fit=crop&q=80',
      },
      {
        id: 'a2',
        name: 'Bread',
        image:
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=96&h=96&fit=crop&q=80',
      },
    ],
  },
  {
    id: '2',
    statusTitle: 'Arrived in 11 minutes',
    amount: 287,
    dateLabel: '12 Apr 2025',
    items: [
      {
        id: 'b1',
        name: 'Fruits',
        image:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=96&h=96&fit=crop&q=80',
      },
      {
        id: 'b2',
        name: 'Eggs',
        image:
          'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=96&h=96&fit=crop&q=80',
      },
      {
        id: 'b3',
        name: 'Snacks',
        image:
          'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=96&h=96&fit=crop&q=80',
      },
    ],
  },
  {
    id: '3',
    statusTitle: 'Order arrived',
    amount: 94,
    dateLabel: '5 Apr 2025',
    items: [
      {
        id: 'c1',
        name: 'Drinks',
        image:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=96&h=96&fit=crop&q=80',
      },
    ],
  },
  {
    id: '4',
    statusTitle: 'Arrived in 8 minutes',
    amount: 412,
    dateLabel: '28 Mar 2025',
    items: [
      {
        id: 'd1',
        name: 'Rice',
        image:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=96&h=96&fit=crop&q=80',
      },
      {
        id: 'd2',
        name: 'Masala',
        image:
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=96&h=96&fit=crop&q=80',
      },
    ],
  },
];

function OrderCardView({ order }: { order: OrderCard }) {
  return (
    <article className="bk-order-card">
      <button type="button" className="bk-order-card__header">
        <span className="bk-order-card__status-ico" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blinkit-parity/icons/account/order-check.svg"
            alt=""
            width={20}
            height={20}
          />
        </span>
        <span className="bk-order-card__status-copy">
          <span className="bk-order-card__title">{order.statusTitle}</span>
          <span className="bk-order-card__meta">
            ₹{order.amount} · {order.dateLabel}
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="bk-order-card__chevron"
          src="/blinkit-parity/icons/account/chevron-right.svg"
          alt=""
          width={16}
          height={16}
          aria-hidden
        />
      </button>
      <div className="bk-order-card__items">
        {order.items.map((item) => (
          <div key={item.id} className="bk-order-card__thumb" title={item.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} width={48} height={48} loading="lazy" />
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AccountOrdersPage() {
  return (
    <div className="bk-orders">
      <div className="bk-orders__list">
        {DEMO_ORDERS.map((order) => (
          <OrderCardView key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
