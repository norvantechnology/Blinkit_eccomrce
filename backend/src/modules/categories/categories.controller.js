const categoriesService = require('./categories.service');
const { success } = require('../../utils/response');

const list = async (_req, res, next) => {
  try {
    const categories = await categoriesService.listTopLevel();
    return success(res, { categories });
  } catch (err) {
    next(err);
  }
};

const subcategories = async (req, res, next) => {
  try {
    const categories = await categoriesService.listSubcategories(req.params.id);
    return success(res, { categories });
  } catch (err) {
    next(err);
  }
};

const adminList = async (_req, res, next) => {
  try {
    const categories = await categoriesService.adminList();
    return success(res, { categories });
  } catch (err) {
    next(err);
  }
};

const adminCreate = async (req, res, next) => {
  try {
    const category = await categoriesService.adminCreate(req.body);
    return success(res, { category }, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

const adminUpdate = async (req, res, next) => {
  try {
    const category = await categoriesService.adminUpdate(req.params.id, req.body);
    return success(res, { category }, 'Category updated');
  } catch (err) {
    next(err);
  }
};

const adminRemove = async (req, res, next) => {
  try {
    const result = await categoriesService.adminRemove(req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const adminListSubcategories = async (req, res, next) => {
  try {
    const categories = await categoriesService.adminListSubcategories(req.params.id);
    return success(res, { categories });
  } catch (err) {
    next(err);
  }
};

const adminCreateSubcategory = async (req, res, next) => {
  try {
    const category = await categoriesService.adminCreateSubcategory(req.params.id, req.body);
    return success(res, { category }, 'Subcategory created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  subcategories,
  adminList,
  adminCreate,
  adminUpdate,
  adminRemove,
  adminListSubcategories,
  adminCreateSubcategory,
};
