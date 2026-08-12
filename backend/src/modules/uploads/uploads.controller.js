const uploadsService = require('./uploads.service');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

const upload = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('file is required (multipart field name: file)', 400);

    const folder = req.body?.folder || 'misc';
    const file = await uploadsService.uploadBuffer({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      folder,
    });

    return success(res, { file }, 'File uploaded', 201);
  } catch (err) {
    return next(err);
  }
};

const presign = async (req, res, next) => {
  try {
    const data = await uploadsService.createPresign(req.body);
    return success(res, { upload: data }, 'Presigned upload URL created');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await uploadsService.removeObject(req.body.key);
    return success(res, data, 'File deleted');
  } catch (err) {
    return next(err);
  }
};

module.exports = { upload, presign, remove };
