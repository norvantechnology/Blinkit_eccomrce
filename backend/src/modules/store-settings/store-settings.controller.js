const service = require('./store-settings.service');
const { success } = require('../../utils/response');

const getPublicPrivacyPolicy = async (req, res, next) => {
  try {
    const locale = req.query.locale === 'hi' ? 'hi' : 'en';
    const data = await service.getPrivacyPolicy(locale);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getAdminPrivacyPolicy = async (req, res, next) => {
  try {
    const data = await service.getAdminPrivacyPolicy();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updatePrivacyPolicy = async (req, res, next) => {
  try {
    const data = await service.updatePrivacyPolicy(req.body);
    return success(res, data, 'Privacy policy updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicPrivacyPolicy,
  getAdminPrivacyPolicy,
  updatePrivacyPolicy,
};
