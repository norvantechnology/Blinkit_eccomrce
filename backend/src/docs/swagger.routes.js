const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { buildOpenApiSpec } = require('./openapi');

const router = express.Router();

const swaggerOptions = {
  explorer: true,
  persistAuthorization: true,
  displayRequestDuration: true,
  docExpansion: 'list',
  filter: true,
};

router.get('/openapi.json', (req, res) => {
  res.json(buildOpenApiSpec(req));
});

router.use(
  '/',
  swaggerUi.serve,
  (req, res, next) => {
    const spec = buildOpenApiSpec(req);
    swaggerUi.setup(spec, {
      ...swaggerOptions,
      customSiteTitle: 'Tapi Grocery API Docs',
      swaggerOptions: {
        ...swaggerOptions,
        url: undefined,
      },
    })(req, res, next);
  },
);

module.exports = router;
