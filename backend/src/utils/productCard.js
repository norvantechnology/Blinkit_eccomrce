const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const stockFromInventory = (inventory) => {
  if (!inventory) return 0;
  return Math.max(0, (inventory.quantityAvailable || 0) - (inventory.quantityReserved || 0));
};

const formatVariant = (variant) => {
  if (!variant) return null;
  return {
    id: variant.id,
    sku: variant.sku,
    weightOrSize: variant.weightOrSize,
    mrp: toNumber(variant.mrp),
    sellingPrice: toNumber(variant.sellingPrice),
    discountPercent: toNumber(variant.discountPercent),
    stock: stockFromInventory(variant.inventory),
    isActive: variant.isActive,
  };
};

const primaryImageUrl = (product) => {
  if (!product?.images?.length) return null;
  const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted[0]?.cdnUrl || null;
};

const pickPrimaryVariant = (product) => {
  if (!product?.variants?.length) return null;
  const active = product.variants.find((v) => v.isActive) || product.variants[0];
  return active;
};

/**
 * Product card shape for listings / shelves / search.
 */
const formatProductCard = (product) => {
  const variant = pickPrimaryVariant(product);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl: primaryImageUrl(product),
    brand: product.brand
      ? { id: product.brand.id, name: product.brand.name, logoUrl: product.brand.logoUrl }
      : null,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    variant: formatVariant(variant),
  };
};

const formatProductDetail = (product) => {
  const card = formatProductCard(product);
  return {
    ...card,
    description: product.description,
    nutritionalInfo: product.nutritionalInfo,
    ingredients: product.ingredients,
    shelfLife: product.shelfLife,
    storageInstructions: product.storageInstructions,
    manufacturerDetails: product.manufacturerDetails,
    isActive: product.isActive,
    images: (product.images || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        cdnUrl: img.cdnUrl,
        sortOrder: img.sortOrder,
        variantId: img.variantId,
      })),
    variants: (product.variants || []).map(formatVariant),
  };
};

const productListInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: 'asc' } },
  variants: {
    where: { isActive: true },
    include: { inventory: true },
    orderBy: { createdAt: 'asc' },
  },
};

const productDetailInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: 'asc' } },
  variants: {
    include: { inventory: true },
    orderBy: { createdAt: 'asc' },
  },
};

module.exports = {
  toNumber,
  formatVariant,
  formatProductCard,
  formatProductDetail,
  productListInclude,
  productDetailInclude,
  stockFromInventory,
};
