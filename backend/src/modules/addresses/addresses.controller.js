const addressesService = require('./addresses.service');
const { success } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const addresses = await addressesService.list(req.user.id);
    return success(res, { addresses });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const address = await addressesService.create(req.user.id, req.body);
    return success(res, { address }, 'Address created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const address = await addressesService.update(req.user.id, req.params.id, req.body);
    return success(res, { address }, 'Address updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await addressesService.remove(req.user.id, req.params.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const setDefault = async (req, res, next) => {
  try {
    const address = await addressesService.setDefault(req.user.id, req.params.id);
    return success(res, { address }, 'Default address updated');
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    const results = await addressesService.search(req.query.q);
    return success(res, { results });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, search, create, update, remove, setDefault };
