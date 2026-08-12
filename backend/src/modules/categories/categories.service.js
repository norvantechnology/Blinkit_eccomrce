const env = require('../../config/env');
const { AppError } = require('../../utils/errors');
const { slugify } = require('../../utils/slugify');
const categoriesRepository = require('./categories.repository');

const requireStoreId = () => {
  if (!env.defaultStoreId) {
    throw new AppError('DEFAULT_STORE_ID is not configured', 500);
  }
  return env.defaultStoreId;
};

const formatCategory = (cat) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  imageUrl: cat.imageUrl,
  parentId: cat.parentId,
  sortOrder: cat.sortOrder,
  isActive: cat.isActive,
  ...(cat.children
    ? {
        children: cat.children.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.imageUrl,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        })),
      }
    : {}),
});

const listTopLevel = async () => {
  const storeId = requireStoreId();
  const categories = await categoriesRepository.findTopLevel(storeId);
  return categories.map(formatCategory);
};

const listSubcategories = async (parentId) => {
  const storeId = requireStoreId();
  const parent = await categoriesRepository.findById(parentId, storeId);
  if (!parent) {
    throw new AppError('Category not found', 404);
  }
  const children = await categoriesRepository.findSubcategories(parentId, storeId);
  return children.map(formatCategory);
};

const adminList = async () => {
  const storeId = requireStoreId();
  const categories = await categoriesRepository.findAllAdmin(storeId);
  return categories.map(formatCategory);
};

const adminCreate = async (body) => {
  const storeId = requireStoreId();
  const slug = body.slug || slugify(body.name);
  if (body.parentId) {
    const parent = await categoriesRepository.findById(body.parentId, storeId);
    if (!parent) throw new AppError('Parent category not found', 404);
  }
  const category = await categoriesRepository.create({
    storeId,
    name: body.name,
    slug,
    imageUrl: body.imageUrl || null,
    parentId: body.parentId || null,
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive ?? true,
  });
  return formatCategory(category);
};

const adminUpdate = async (id, body) => {
  const storeId = requireStoreId();
  const existing = await categoriesRepository.findById(id, storeId);
  if (!existing) throw new AppError('Category not found', 404);

  const category = await categoriesRepository.update(id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.slug !== undefined && { slug: body.slug }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    ...(body.parentId !== undefined && { parentId: body.parentId }),
    ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  });
  return formatCategory(category);
};

const adminRemove = async (id) => {
  const storeId = requireStoreId();
  const existing = await categoriesRepository.findById(id, storeId);
  if (!existing) throw new AppError('Category not found', 404);
  await categoriesRepository.remove(id);
  return { message: 'Category deleted' };
};

const adminCreateSubcategory = async (parentId, body) => {
  return adminCreate({ ...body, parentId });
};

const adminListSubcategories = async (parentId) => {
  return listSubcategories(parentId);
};

module.exports = {
  listTopLevel,
  listSubcategories,
  adminList,
  adminCreate,
  adminUpdate,
  adminRemove,
  adminCreateSubcategory,
  adminListSubcategories,
  formatCategory,
};
