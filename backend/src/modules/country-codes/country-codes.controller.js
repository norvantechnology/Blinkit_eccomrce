const service = require('./country-codes.service');
const { success } = require('../../utils/response');

const listPublic = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    return success(res, await service.listPublic());
  } catch (err) {
    next(err);
  }
};

const listAdmin = async (req, res, next) => {
  try {
    return success(res, await service.listAdmin());
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    return success(res, await service.create(req.body), 'Country code added', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    return success(res, await service.update(req.params.id, req.body), 'Country code updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    return success(res, await service.remove(req.params.id), 'Country code deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { listPublic, listAdmin, create, update, remove };
