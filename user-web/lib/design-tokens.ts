/** Blinkit customer-web baseline tokens (§19A.0) for parity checks. */
export const blinkitTokens = {
  brandYellow: '#F8CB46',
  brandYellowHover: '#F0C033',
  cartGreen: '#0C831F',
  cartGreenDisabled: '#CCCCCC',
  text: '#1F1F1F',
  textMuted: '#363636',
  placeholder: '#999999',
  searchBg: 'rgb(248, 248, 248)',
  searchBorder: 'rgb(232, 232, 232)',
  divider: '#F2F2F2',
  headerHover: '#FCFCFC',
  surface: '#FFFFFF',
  pageBg: '#F4F6FB',
  radiusSearch: 12,
  /** Blinkit Okra → Plus Jakarta Sans (license-safe) */
  fontFamily: 'Plus Jakarta Sans',
  headerHeightDesktop: 86,
  headerHeightMobile: 68,
  defaultStore: {
    lat: 12.9716,
    lng: 77.5946,
    label: 'Bangalore',
    fullAddress: 'MG Road, Bangalore',
    etaMinutes: 8,
  },
} as const;
