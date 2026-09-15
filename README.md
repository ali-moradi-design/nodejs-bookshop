# Bookstore API

Node.js + TypeScript + Express + Mongoose backend with JWT auth, RBAC, books, reviews, orders (fake payments + stock), and reports/analytics.

## Stack

- Express 5, Mongoose, Zod, Helmet, express-rate-limit
- bcryptjs, jsonwebtoken, dotenv, cors, morgan
- swagger-ui-express (OpenAPI at `/api/docs`)
- ESLint + Prettier, tsx for dev

## Setup

```bash
cp .env.example .env
# edit secrets if needed
npm install
# start MongoDB locally (mongodb://127.0.0.1:27017/bookstore)
npm run seed
npm run dev
```

Default admin (from seed):

- Email: `admin@bookstore.local`
- Password: `Admin123!`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch |
| `npm run build` | compile to `dist/` |
| `npm start` | run compiled server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run seed` | permissions, roles, admin, sample books |

## Key routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | health |
| GET | `/api/docs` | Swagger UI |
| POST | `/api/auth/register` | customer role |
| POST | `/api/auth/login` | access + refresh |
| POST | `/api/auth/refresh` | rotate refresh |
| POST | `/api/auth/logout` | revoke refresh |
| CRUD | `/api/permissions` | RBAC |
| CRUD | `/api/roles` | assign permissions |
| CRUD | `/api/users` | assign roles; `GET /me` |
| CRUD | `/api/books` | list/get public; mutations need perms |
| CRUD | `/api/reviews` | multiple reviews per user/book allowed |
| POST | `/api/orders` | create → `pending_payment` |
| POST | `/api/orders/:id/pay` | fake pay + atomic stock |
| PATCH | `/api/orders/:id/status` | staff status transitions |
| CRUD | `/api/reports/issues` | user create / staff manage |
| GET | `/api/reports/analytics/*` | revenue, status, top books, sales by date |

## Curl examples

```bash
# Login as admin
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bookstore.local","password":"Admin123!"}'

# Save token then list books
export TOKEN=...
curl -s http://localhost:4000/api/books

# Create book
curl -s -X POST http://localhost:4000/api/books \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Demo","author":"A","description":"D","price":9.99,"stock":10}'

# Register customer
curl -s -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane@example.com","password":"Password123!"}'

# Create order (as customer)
curl -s -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"book":"BOOK_ID","quantity":1}],"shippingAddress":{"fullName":"Jane","line1":"1 Main","city":"Tehran","postalCode":"1000","country":"IR"}}'

# Pay order
curl -s -X POST http://localhost:4000/api/orders/ORDER_ID/pay \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

## Notes

- Access JWT is short-lived; refresh tokens are SHA-256 hashed in `RefreshToken` with rotation on refresh.
- Soft-deleted documents (`deletedAt`) are excluded from default queries.
- Order payment uses per-item `updateOne({ stock: { $gte: qty } })` so stock cannot go negative; on failure the order moves to `failed` and any decrements are rolled back.
