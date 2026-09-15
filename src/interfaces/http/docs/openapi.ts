export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bookstore API',
    version: '2.0.0',
    description:
      'Node.js + Express + Mongoose bookstore backend with JWT auth, RBAC, cart, favorites, discounts, uploads, and admin dashboard. Business routes are under /api/v1 (breaking change from unversioned /api).',
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
          featured: { type: 'boolean' },
          featuredOrder: { type: 'integer' },
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
          shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          discountCode: { type: 'string' },
        },
      },
      ShippingAddress: {
        type: 'object',
        required: ['fullName', 'line1', 'city', 'postalCode', 'country'],
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
      CartItem: {
        type: 'object',
        properties: {
          bookId: { type: 'string' },
          quantity: { type: 'integer' },
        },
      },
      Discount: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          type: { type: 'string', enum: ['percent', 'fixed'] },
          value: { type: 'number' },
          minOrderAmount: { type: 'number' },
          maxUses: { type: 'integer' },
          usedCount: { type: 'integer' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check (unversioned)',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/auth/register': {
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
    '/api/v1/auth/login': {
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
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke refresh token',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/books': {
      get: {
        tags: ['Books'],
        summary: 'List/search books',
        description:
          'Search uses case-insensitive regex on title/author/description (text index also defined for future $text). Query: q, category, minPrice, maxPrice, inStock, featured, page, limit, sort (price|title|createdAt), order (asc|desc).',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price', 'title', 'createdAt'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
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
    '/api/v1/books/featured': {
      get: {
        tags: ['Books'],
        summary: 'List featured books',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      patch: {
        tags: ['Books'],
        summary: 'Update book (incl. featured flags)',
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
    '/api/v1/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current user cart',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear cart',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId', 'quantity'],
                properties: {
                  bookId: { type: 'string' },
                  quantity: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/cart/items/{bookId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'bookId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'bookId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/cart/checkout': {
      post: {
        tags: ['Cart'],
        summary: 'Checkout cart → pending_payment order; clears cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingAddress'],
                properties: {
                  shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
                  discountCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Order created' } },
      },
    },
    '/api/v1/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'List favorites',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Favorites'],
        summary: 'Add favorite',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId'],
                properties: { bookId: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/favorites/{bookId}': {
      delete: {
        tags: ['Favorites'],
        summary: 'Remove favorite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'bookId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/discounts': {
      get: {
        tags: ['Discounts'],
        summary: 'List discounts (admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Discounts'],
        summary: 'Create discount',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Discount' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/discounts/{id}': {
      get: {
        tags: ['Discounts'],
        summary: 'Get discount',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      patch: {
        tags: ['Discounts'],
        summary: 'Update discount',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['Discounts'],
        summary: 'Soft-delete discount',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/uploads/book-cover': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload book cover image (multipart field: file)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { url: { type: 'string', example: '/uploads/books/123-cover.jpg' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders (own or all)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order (optional discountCode)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrder' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/orders/{id}/pay': {
      post: {
        tags: ['Orders'],
        summary: 'Fake payment + atomic stock decrement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Paid' }, '409': { description: 'Insufficient stock' } },
      },
    },
    '/api/v1/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/reviews': {
      get: { tags: ['Reviews'], summary: 'List reviews', responses: { '200': { description: 'OK' } } },
      post: {
        tags: ['Reviews'],
        summary: 'Create review',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/permissions': {
      get: {
        tags: ['RBAC'],
        summary: 'List permissions',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/roles': {
      get: {
        tags: ['RBAC'],
        summary: 'List roles',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/reports/issues': {
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
    '/api/v1/reports/analytics/revenue': {
      get: {
        tags: ['Reports'],
        summary: 'Revenue summary',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/admin/dashboard/summary': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard summary counts',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/admin/dashboard/recent-orders': {
      get: {
        tags: ['Admin'],
        summary: 'Recent orders',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/admin/dashboard/low-stock': {
      get: {
        tags: ['Admin'],
        summary: 'Low-stock books',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'threshold', in: 'query', schema: { type: 'integer', default: 5 } }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;
