/** Tapi Grocery brand assets hosted on S3 (public `uploads/brand/*`). */
const S3_BRAND_BASE =
  'https://tapi-grocery-assets-711266489084.s3.ap-south-1.amazonaws.com/uploads/brand';

export const BRAND_ASSETS = {
  wordmark: `${S3_BRAND_BASE}/tapi-grocery.png`,
  wordmarkMd: `${S3_BRAND_BASE}/tapi-grocery-1.png`,
  appIcon: `${S3_BRAND_BASE}/tapi-grocery-400x400.jpg`,
  favicon: `${S3_BRAND_BASE}/favicon-150x150.jpg`,
  faviconLg: `${S3_BRAND_BASE}/favicon-400x400.jpg`,
} as const;
