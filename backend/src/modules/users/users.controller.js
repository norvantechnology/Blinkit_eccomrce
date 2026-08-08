const usersService = require('./users.service');
const { success } = require('../../utils/response');

const getMe = async (req, res, next) => {
  try {
    const user = await usersService.getMe(req.user.id);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await usersService.updateMe(req.user.id, req.body);
    return success(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

const updateLanguage = async (req, res, next) => {
  try {
    const user = await usersService.updateLanguage(req.user.id, req.body.languagePref);
    return success(res, { user }, 'Language preference updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, updateLanguage };
