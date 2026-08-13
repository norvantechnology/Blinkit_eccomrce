const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const { globalAdminAudit } = require('./middlewares/auditLogger');
const swaggerRoutes = require('./docs/swagger.routes');

// Milestone 1 route modules
const authRoutes = require('./modules/auth/auth.routes');
const { authRouter, adminRouter } = require('./modules/admin-users/admin-users.routes');
const usersRoutes = require('./modules/users/users.routes');
const addressesRoutes = require('./modules/addresses/addresses.routes');
const placesRoutes = require('./modules/places/places.routes');
const {
  userUploadsRouter,
  adminUploadsRouter,
} = require('./modules/uploads/uploads.routes');

const app = express();

app.set('trust proxy', true);

// API docs — mount before helmet (Swagger UI needs inline assets)
app.use('/api-docs', swaggerRoutes);

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.nodeEnv,
    s3: Boolean(env.aws.s3Bucket),
  });
});

const apiRouter = express.Router();

// Global audit: logs mutating admin actions when req.admin is present
apiRouter.use(globalAdminAudit);

// §8.1 Auth (User App)
apiRouter.use('/auth', authRoutes);

// §8.2 Admin Auth + admin routes (RBAC-protected)
apiRouter.use('/admin/auth', authRouter);
apiRouter.use('/admin/uploads', adminUploadsRouter);
apiRouter.use('/admin', adminRouter);

// §8.3 User Profile & Addresses
apiRouter.use('/users', usersRoutes);
/** Public Google Places search (no auth) — used by location picker before login */
apiRouter.use('/places', placesRoutes);
apiRouter.use('/addresses', addressesRoutes);

// Uploads (S3) — user + admin mirrors
apiRouter.use('/uploads', userUploadsRouter);

app.use('/api/v1', apiRouter);

app.use(errorHandler);

module.exports = app;
