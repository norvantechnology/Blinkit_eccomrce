const addressesRepository = require('./addresses.repository');
const mapsProvider = require('../../integrations/maps-provider');
const { AppError } = require('../../utils/errors');

const list = (userId) => addressesRepository.findByUserId(userId);

const search = async (query) => {
  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }
  const results = await mapsProvider.searchAddresses(query.trim());
  return results;
};

const create = (userId, data) => addressesRepository.create(userId, data);

const update = async (userId, id, data) => {
  const address = await addressesRepository.update(id, userId, data);
  if (!address) {
    throw new AppError('Address not found', 404);
  }
  return address;
};

const remove = async (userId, id) => {
  const address = await addressesRepository.remove(id, userId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }
  return { message: 'Address deleted successfully' };
};

const setDefault = async (userId, id) => {
  const address = await addressesRepository.setDefault(id, userId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }
  return address;
};

module.exports = { list, search, create, update, remove, setDefault };
