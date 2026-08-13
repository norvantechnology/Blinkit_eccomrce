const env = require('../config/env');

/**
 * Resolve public API origin from the incoming request.
 * Priority: API_BASE_URL env → Referer origin → X-Forwarded-* → req host.
 */
function resolvePublicOrigin(req) {
  if (env.apiBaseUrl) {
    return env.apiBaseUrl.replace(/\/$/, '');
  }

  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore invalid referer
    }
  }

  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${env.port}`;
  return `${protocol}://${host}`;
}

function buildOpenApiSpec(req) {
  const origin = resolvePublicOrigin(req);

  return {
    openapi: '3.0.3',
    info: {
      title: 'Tapi Grocery API',
      version: '1.0.0',
      description:
        'Tapi Grocery single-store quick-commerce API (Milestone 1). Server URL is detected from your browser address.',
    },
    servers: [
      {
        url: `${origin}/api/v1`,
        description: 'Auto-detected from current URL',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service health' },
      { name: 'Auth', description: 'User authentication' },
      { name: 'Admin Auth', description: 'Admin panel authentication' },
      { name: 'Admin', description: 'Admin RBAC endpoints' },
      { name: 'Users', description: 'User profile' },
      { name: 'Addresses', description: 'User addresses' },
      { name: 'Uploads', description: 'S3 image/file uploads (user)' },
      { name: 'Admin Uploads', description: 'S3 image/file uploads (admin)' },
      { name: 'Places', description: 'Address search' },
      { name: 'Content', description: 'Public CMS content' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        UploadedFile: {
          type: 'object',
          properties: {
            key: { type: 'string', example: 'uploads/products/uuid-name.jpg' },
            url: {
              type: 'string',
              example:
                'https://bucket.s3.ap-south-1.amazonaws.com/uploads/products/uuid-name.jpg',
            },
            contentType: { type: 'string', example: 'image/jpeg' },
            size: { type: 'integer', example: 245678 },
            originalName: { type: 'string', example: 'mango.jpg' },
            stub: { type: 'boolean', example: false },
          },
        },
        PresignUpload: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            uploadUrl: { type: 'string', description: 'Presigned S3 PUT URL' },
            publicUrl: { type: 'string', description: 'Final public object URL' },
            headers: {
              type: 'object',
              properties: { 'Content-Type': { type: 'string' } },
            },
            expiresIn: { type: 'integer', example: 900 },
            method: { type: 'string', example: 'PUT' },
            stub: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          servers: [{ url: origin }],
          responses: {
            200: {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      env: { type: 'string' },
                      s3: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/otp/send': {
        post: {
          tags: ['Auth'],
          summary: 'Send OTP to phone',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone'],
                  properties: { phone: { type: 'string', example: '+919999999999' } },
                },
              },
            },
          },
          responses: { 200: { description: 'OTP sent' } },
        },
      },
      '/auth/otp/verify': {
        post: {
          tags: ['Auth'],
          summary: 'Verify OTP and login/register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone', 'otp'],
                  properties: {
                    phone: { type: 'string' },
                    otp: { type: 'string' },
                    deviceId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Tokens + user' } },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Complete user registration',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Registered user' } },
        },
      },
      '/auth/login/email': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Tokens + user' } },
        },
      },
      '/auth/oauth/google': {
        post: {
          tags: ['Auth'],
          summary: 'Google OAuth login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['idToken'],
                  properties: {
                    idToken: { type: 'string' },
                    deviceId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Tokens + user' } },
        },
      },
      '/auth/oauth/apple': {
        post: {
          tags: ['Auth'],
          summary: 'Apple Sign-In (identity token)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['idToken'],
                  properties: {
                    idToken: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    deviceId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Tokens + user' } },
        },
      },
      '/auth/firebase/verify': {
        post: {
          tags: ['Auth'],
          summary: 'Firebase verify (not implemented)',
          responses: { 501: { description: 'Not implemented' } },
        },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Rotate refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'New tokens' } },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout user',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/auth/account': {
        delete: {
          tags: ['Auth'],
          summary: 'Delete user account',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Account deleted' } },
        },
      },
      '/auth/password': {
        post: {
          tags: ['Auth'],
          summary: 'Set or update email-login password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password'],
                  properties: { password: { type: 'string', minLength: 6 } },
                },
              },
            },
          },
          responses: { 200: { description: 'Password updated' } },
        },
      },
      '/admin/auth/login': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Admin login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@gmail.com' },
                    password: { type: 'string', example: 'admin@123' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Admin tokens + user' } },
        },
      },
      '/admin/auth/refresh-token': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Admin refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'New tokens' } },
        },
      },
      '/admin/auth/logout': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Admin logout',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/admin/auth/forgot-password': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Request password reset email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Reset email sent if account exists' } },
        },
      },
      '/admin/auth/reset-password': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Reset admin password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password reset' } },
        },
      },
      '/admin/permissions': {
        get: {
          tags: ['Admin'],
          summary: 'List RBAC permissions',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Permission list' }, 403: { description: 'Forbidden' } },
        },
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'User profile (includes avatarUrl)' } },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update current user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    avatarUrl: {
                      type: 'string',
                      format: 'uri',
                      nullable: true,
                      description: 'Public URL returned by /uploads',
                    },
                    languagePref: { type: 'string', enum: ['en', 'hi'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated profile' } },
        },
      },
      '/users/me/language': {
        patch: {
          tags: ['Users'],
          summary: 'Update preferred language',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Language updated' } },
        },
      },
      '/uploads': {
        post: {
          tags: ['Uploads'],
          summary: 'Upload file via multipart (server → S3)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    folder: {
                      type: 'string',
                      enum: ['products', 'banners', 'avatars', 'documents', 'reviews', 'misc'],
                      default: 'misc',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Uploaded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: { file: { $ref: '#/components/schemas/UploadedFile' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Uploads'],
          summary: 'Delete uploaded object by key',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['key'],
                  properties: { key: { type: 'string', example: 'uploads/avatars/uuid-a.jpg' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/uploads/presign': {
        post: {
          tags: ['Uploads'],
          summary: 'Get presigned PUT URL (browser → S3 direct)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fileName', 'contentType'],
                  properties: {
                    fileName: { type: 'string', example: 'avatar.jpg' },
                    contentType: {
                      type: 'string',
                      enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
                    },
                    folder: {
                      type: 'string',
                      enum: ['products', 'banners', 'avatars', 'documents', 'reviews', 'misc'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Presign payload',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: { upload: { $ref: '#/components/schemas/PresignUpload' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/uploads': {
        post: {
          tags: ['Admin Uploads'],
          summary: 'Admin multipart upload',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Same shape as POST /uploads' } },
        },
        delete: {
          tags: ['Admin Uploads'],
          summary: 'Admin delete object',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/admin/uploads/presign': {
        post: {
          tags: ['Admin Uploads'],
          summary: 'Admin presigned PUT URL',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Same shape as POST /uploads/presign' } },
        },
      },
      '/places/search': {
        get: {
          tags: ['Places'],
          summary: 'Public address search (Google Places or 503 — UI falls back to OSM)',
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Search results' }, 503: { description: 'Maps not configured' } },
        },
      },
      '/addresses/search': {
        get: {
          tags: ['Addresses'],
          summary: 'Search addresses (same as /places/search; no auth required)',
          parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Search results' }, 503: { description: 'Maps not configured' } },
        },
      },
      '/addresses': {
        get: {
          tags: ['Addresses'],
          summary: 'List user addresses',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Address list' } },
        },
        post: {
          tags: ['Addresses'],
          summary: 'Create address',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Address created' } },
        },
      },
      '/addresses/{id}': {
        patch: {
          tags: ['Addresses'],
          summary: 'Update address',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Address updated' } },
        },
        delete: {
          tags: ['Addresses'],
          summary: 'Delete address',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Address deleted' } },
        },
      },
      '/addresses/{id}/default': {
        patch: {
          tags: ['Addresses'],
          summary: 'Set default address',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Default updated' } },
        },
      },
      '/content/privacy-policy': {
        get: {
          tags: ['Content'],
          summary: 'Public account privacy policy (markdown)',
          parameters: [
            {
              name: 'locale',
              in: 'query',
              schema: { type: 'string', enum: ['en', 'hi'], default: 'en' },
            },
          ],
          responses: { 200: { description: 'title, markdown, excerpt' } },
        },
      },
      '/admin/store-settings/privacy-policy': {
        get: {
          tags: ['Admin'],
          summary: 'Get EN + HI privacy policy for CMS',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'en + hi policy objects' }, 403: { description: 'Forbidden' } },
        },
        patch: {
          tags: ['Admin'],
          summary: 'Update privacy policy markdown',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['markdown'],
                  properties: {
                    locale: { type: 'string', enum: ['en', 'hi'] },
                    markdown: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated policy' }, 403: { description: 'Forbidden' } },
        },
      },
    },
  };
}

module.exports = { buildOpenApiSpec, resolvePublicOrigin };
