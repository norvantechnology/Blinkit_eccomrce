const { Router } = require('express');
const usersController = require('./users.controller');
const usersValidator = require('./users.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');

const router = Router();

router.use(authenticate('user'));

router.get('/me', usersController.getMe);

router.patch('/me', validateRequest(usersValidator.updateMeSchema), usersController.updateMe);

router.patch(
  '/me/language',
  validateRequest(usersValidator.updateLanguageSchema),
  usersController.updateLanguage,
);

module.exports = router;
