export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bookstore API',
    version: '1.0.0',
    description:
      'Node.js + Express + Mongoose bookstore backend with JWT auth, RBAC, orders, reviews, and reports.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: {},
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          description: { type: 'string' },
          isbn: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          stock: { type: 'integer' },
          coverImageUrl: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
        },
      },
      CreateOrder: {
        type: 'object',
        required: ['items', 'shippingAddress'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                book: { type: 'string' },
                quantity: { type: 'integer' },
              },
            },
          },
          shippingAddress: {
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              line1: { type: 'string' },
              line2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register (customer role)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: { '201': { description: 'Created' }, '409': { description: 'Conflict' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/api/auth/refresh': {
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
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke refresh token',
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
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books'],
        summary: 'List books',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Books'],
        summary: 'Create book',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      patch: {
        tags: ['Books'],
        summary: 'Update book',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['Books'],
        summary: 'Soft-delete book',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders (own or all)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order (pending_payment)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrder' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/orders/{id}/pay': {
      post: {
        tags: ['Orders'],
        summary: 'Fake payment + atomic stock decrement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Paid' }, '409': { description: 'Insufficient stock' } },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/reviews': {
      get: { tags: ['Reviews'], summary: 'List reviews', responses: { '200': { description: 'OK' } } },
      post: {
        tags: ['Reviews'],
        summary: 'Create review',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/permissions': {
      get: {
        tags: ['RBAC'],
        summary: 'List permissions',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/roles': {
      get: {
        tags: ['RBAC'],
        summary: 'List roles',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/reports/issues': {
      get: {
        tags: ['Reports'],
        summary: 'List issue reports',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Reports'],
        summary: 'Create issue report',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/reports/analytics/revenue': {
      get: {
        tags: ['Reports'],
        summary: 'Revenue summary',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/reports/analytics/orders-by-status': {
      get: {
        tags: ['Reports'],
        summary: 'Orders by status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/reports/analytics/top-books': {
      get: {
        tags: ['Reports'],
        summary: 'Top selling books',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/reports/analytics/sales-by-date': {
      get: {
        tags: ['Reports'],
        summary: 'Sales by date',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;
