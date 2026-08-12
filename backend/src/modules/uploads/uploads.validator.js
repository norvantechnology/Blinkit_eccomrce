const Joi = require('joi');

const ALLOWED_FOLDERS = [
  'products',
  'banners',
  'avatars',
  'documents',
  'reviews',
  'misc',
];

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const presignSchema = Joi.object({
  fileName: Joi.string().min(1).max(200).required(),
  contentType: Joi.string()
    .valid(...ALLOWED_MIME)
    .required(),
  folder: Joi.string()
    .valid(...ALLOWED_FOLDERS)
    .default('misc'),
});

const deleteSchema = Joi.object({
  key: Joi.string()
    .pattern(/^uploads\/[a-z0-9/_-]+/i)
    .max(500)
    .required(),
});

module.exports = {
  ALLOWED_FOLDERS,
  ALLOWED_MIME,
  presignSchema,
  deleteSchema,
};
