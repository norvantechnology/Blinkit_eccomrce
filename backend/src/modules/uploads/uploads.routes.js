const { Router } = require('express');
const multer = require('multer');
const uploadsController = require('./uploads.controller');
const uploadsValidator = require('./uploads.validator');
const uploadsService = require('./uploads.service');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const { AppError } = require('../../utils/errors');

const uploadMw = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadsService.MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!uploadsValidator.ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new AppError('Unsupported file type', 400));
    }
    return cb(null, true);
  },
});

/**
 * Auth: user OR admin access token.
 * Mounted at /api/v1/uploads and /api/v1/admin/uploads
 */
const buildRouter = (audience) => {
  const router = Router();
  const auth = authenticate(audience);

  router.post('/', auth, uploadMw.single('file'), uploadsController.upload);

  router.post(
    '/presign',
    auth,
    validateRequest(uploadsValidator.presignSchema),
    uploadsController.presign,
  );

  router.delete(
    '/',
    auth,
    validateRequest(uploadsValidator.deleteSchema),
    uploadsController.remove,
  );

  return router;
};

module.exports = {
  userUploadsRouter: buildRouter('user'),
  adminUploadsRouter: buildRouter('admin'),
};
