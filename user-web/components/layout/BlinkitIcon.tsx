/** Blinkit parity icons (wasabicons). */
export function BlinkitIcon({
  name,
  size,
  className,
}: {
  name: 'back' | 'chevron-down' | 'chevron-left' | 'search' | 'cart' | 'profile';
  size?: number;
  className?: string;
}) {
  const defaults: Record<string, number> = {
    back: 20,
    'chevron-down': 10,
    'chevron-left': 20,
    search: 20,
    cart: 28,
    profile: 20,
  };
  const px = size ?? defaults[name] ?? 20;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/blinkit-parity/icons/${name}.svg`}
      alt=""
      width={px}
      height={px}
      className={className}
      aria-hidden
      draggable={false}
    />
  );
}
