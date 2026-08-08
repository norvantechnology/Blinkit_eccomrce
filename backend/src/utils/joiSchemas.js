const Joi = require('joi');

/** Joi email schema allowing .local and other dev TLDs */
const email = () => Joi.string().email({ tlds: { allow: false } });

module.exports = { email };
