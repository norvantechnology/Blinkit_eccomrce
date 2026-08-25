/** Tapi Grocery brand assets hosted on S3 (public `uploads/brand/*`). */
const S3_BRAND_BASE =
  'https://tapi-grocery-assets-711266489084.s3.ap-south-1.amazonaws.com/uploads/brand';

export const BRAND_ASSETS = {
  /** Header / footer wordmark (~149×91) */
  wordmark: `${S3_BRAND_BASE}/tapi-grocery.png`,
  /** Wider wordmark */
  wordmarkMd: `${S3_BRAND_BASE}/tapi-grocery-1.png`,
  wordmarkLg: `${S3_BRAND_BASE}/tapi-grocery-2.png`,
  /** App / login square mark */
  appIcon: `${S3_BRAND_BASE}/tapi-grocery-400x400.jpg`,
  appIconLg: `${S3_BRAND_BASE}/tapi-grocery-800x800.jpg`,
  icon150: `${S3_BRAND_BASE}/tapi-150x150.jpg`,
  favicon: `${S3_BRAND_BASE}/favicon-150x150.jpg`,
  faviconLg: `${S3_BRAND_BASE}/favicon-400x400.jpg`,
} as const;
