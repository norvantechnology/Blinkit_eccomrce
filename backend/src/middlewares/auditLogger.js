const prisma = require('../config/database');
const logger = require('../utils/logger');
const env = require('../config/env');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP_PATHS = [
  '/api/v1/admin/auth/login',
  '/api/v1/admin/auth/refresh-token',
  '/api/v1/admin/auth/forgot-password',
  '/api/v1/admin/auth/reset-password',
];

const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '5', 10);
const PURGE_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * Global audit logger for all mutating /admin routes.
 * Captures method, path, body, response status, entity id, IP.
 * Wired once in app.js after authenticate has set req.admin.
 */
const globalAdminAudit = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();
  if (!req.path.startsWith('/admin') && !req.originalUrl.includes('/api/v1/admin')) {
    return next();
  }
  if (SKIP_PATHS.some((p) => req.originalUrl.startsWith(p))) return next();

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (req.admin && res.statusCode >= 200 && res.statusCode < 400) {
      const entity =
        req.baseUrl?.replace(/^\/api\/v1\/?/, '') ||
        req.originalUrl.split('?')[0].replace(/^\/api\/v1\//, '') ||
        'admin';

      const entityId =
        req.params?.id ||
        body?.data?.id ||
        body?.data?.user?.id ||
        null;

      const meta = {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        requestBody: sanitizeBody(req.body),
        statusCode: res.statusCode,
        ...(req.auditMeta || {}),
      };

      prisma.auditLog
        .create({
          data: {
            adminUserId: req.admin.id,
            action: req.method.toLowerCase(),
            entity: entity.slice(0, 100),
            entityId: entityId ? String(entityId) : null,
            ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
            meta,
          },
        })
        .catch((err) => logger.error('Failed to write audit log', { error: err.message }));
    }

    return originalJson(body);
  };

  next();
};

const SENSITIVE_KEYS = new Set(['password', 'token', 'refreshToken', 'accessToken', 'otp']);

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const out = Array.isArray(body) ? [...body] : { ...body };
  for (const key of Object.keys(out)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = '[REDACTED]';
    } else if (out[key] && typeof out[key] === 'object') {
      out[key] = sanitizeBody(out[key]);
    }
  }
  return out;
}

/**
 * Route-scoped audit logger (kept for explicit use on specific controllers).
 */
const auditLogger = (action, entity, getEntityId = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (req.admin && res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId ? getEntityId(req, body) : req.params.id || null;
        const meta = {
          requestBody: sanitizeBody(req.body),
          ...(req.auditMeta?.priorState && { priorState: req.auditMeta.priorState }),
          ...(req.auditMeta?.diff && { diff: req.auditMeta.diff }),
        };

        prisma.auditLog
          .create({
            data: {
              adminUserId: req.admin.id,
              action,
              entity,
              entityId: entityId ? String(entityId) : null,
              ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
              meta,
            },
          })
          .catch((err) => logger.error('Failed to write audit log', { error: err.message }));
      }

      return originalJson(body);
    };

    next();
  };
};

async function purgeExpiredAuditLogs() {
  const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      logger.info(`Purged ${result.count} audit log(s) older than ${AUDIT_RETENTION_DAYS} days`);
    }
  } catch (err) {
    logger.error('Audit log purge failed', { error: err.message });
  }
}

function startAuditLogPurgeJob() {
  // Run once on boot, then hourly
  purgeExpiredAuditLogs();
  const timer = setInterval(purgeExpiredAuditLogs, PURGE_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
  logger.info(`Audit log retention: ${AUDIT_RETENTION_DAYS} days (purge hourly)`);
  return timer;
}

module.exports = auditLogger;
module.exports.globalAdminAudit = globalAdminAudit;
module.exports.purgeExpiredAuditLogs = purgeExpiredAuditLogs;
module.exports.startAuditLogPurgeJob = startAuditLogPurgeJob;
module.exports.AUDIT_RETENTION_DAYS = AUDIT_RETENTION_DAYS;
