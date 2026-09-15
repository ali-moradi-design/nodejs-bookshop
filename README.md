# Bookstore API

Node.js + TypeScript + Express + Mongoose backend with JWT auth, RBAC, books, reviews, orders (fake payments + stock), cart, favorites, discount codes, local image uploads, and admin dashboard.

> **Breaking change:** all business routes are under **`/api/v1/...`**. Health remains at `/api/health`; Swagger at `/api/docs`.

## Architecture (DDD-inspired layers)

```
src/
  domain/           # Entities, enums, repository interfaces (no Express/Mongoose)
  application/      # Use-cases / services, ports (auth tokens, password hashing)
  infrastructure/   # Mongoose models + repos, JWT/bcrypt, env/db, composition root
  interfaces/http/  # Controllers, routes, Zod validators, middleware, OpenAPI
  shared/           # AppError, asyncHandler, pagination helpers
  scripts/seed.ts
  app.ts            # Express app wiring
  server.ts         # Process entry
```

- **Domain** does not import Express or Mongoose.
- Controllers call **application** services; services depend on **repository interfaces** implemented under `infrastructure/persistence/mongoose`.
- Wiring lives in `infrastructure/composition.ts`.

## Stack

- Express 5, Mongoose, Zod, Helmet, express-rate-limit, multer
- bcryptjs, jsonwebtoken, dotenv, cors, morgan
- swagger-ui-express (OpenAPI at `/api/docs`)
- ESLint + Prettier, tsx for dev
- Vitest + supertest + mongodb-memory-server (integration tests)

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

Sample discount codes from seed: `WELCOME10` (10% off, min $20), `FLAT5` ($5 off, min $15).

## Seed & cover images

`npm run seed` upserts:

- Permissions (incl. `discounts:*`, `admin:dashboard`), `admin` / `customer` roles, and the admin user
- **Exactly 40 books**, each with a `coverImageUrl` pointing at Open Library:
  `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`
- **~6 featured books** (`featured: true` + `featuredOrder`)
- Sample discount codes

Books are upserted by **ISBN** (idempotent; re-runs do not duplicate endlessly).

## Book search

`GET /api/v1/books` supports:

| Param | Description |
|-------|-------------|
| `q` | Case-insensitive **regex** on title, author, description (partial matches). A MongoDB **text index** is also defined on those fields for future `$text` use. |
| `category` | Match category tag |
| `minPrice` / `maxPrice` | Price range |
| `inStock` | `true` / `false` |
| `featured` | `true` / `false` |
| `sort` | `price` \| `title` \| `createdAt` |
| `order` | `asc` \| `desc` |
| `page` / `limit` | Pagination |

Dedicated: `GET /api/v1/books/featured`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch |
| `npm run build` | compile to `dist/` |
| `npm start` | run compiled server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run seed` | permissions, roles, admin, 40 imaged books, discounts |
| `npm test` | Vitest + supertest integration suite (in-memory MongoDB) |
| `npm run test:watch` | Vitest watch mode |

## Key routes

### Unversioned

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | health |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs.json` | OpenAPI JSON |
| GET | `/uploads/...` | static uploaded files |

### `/api/v1` business API

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/auth/register` | customer role |
| POST | `/api/v1/auth/login` | access + refresh |
| POST | `/api/v1/auth/refresh` | rotate refresh |
| POST | `/api/v1/auth/logout` | revoke refresh |
| CRUD | `/api/v1/permissions` | RBAC |
| CRUD | `/api/v1/roles` | assign permissions |
| CRUD | `/api/v1/users` | assign roles; `GET /me` |
| CRUD | `/api/v1/books` | list/get public; mutations need perms |
| GET | `/api/v1/books/featured` | public featured list |
| CRUD | `/api/v1/reviews` | multiple reviews per user/book allowed |
| POST | `/api/v1/orders` | create → `pending_payment` (optional `discountCode`) |
| POST | `/api/v1/orders/:id/pay` | fake pay + atomic stock |
| PATCH | `/api/v1/orders/:id/status` | staff status transitions |
| GET/POST/PATCH/DELETE | `/api/v1/cart` (+ `/items`, `/checkout`) | auth cart; checkout needs `orders:create` |
| GET/POST/DELETE | `/api/v1/favorites` | wishlist |
| CRUD | `/api/v1/discounts` | admin discount codes |
| POST | `/api/v1/uploads/book-cover` | multipart `file` → `{ url }` |
| CRUD | `/api/v1/reports/issues` | user create / staff manage |
| GET | `/api/v1/reports/analytics/*` | revenue, status, top books, sales by date |
| GET | `/api/v1/admin/dashboard/summary` | counts (needs `admin:dashboard` or `reports:analytics`) |
| GET | `/api/v1/admin/dashboard/recent-orders` | `?limit=` |
| GET | `/api/v1/admin/dashboard/low-stock` | `?threshold=5` |

## Curl examples

```bash
# Login as admin
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bookstore.local","password":"Admin123!"}'

export TOKEN=...

# List / search books
curl -s 'http://localhost:4000/api/v1/books?q=clean&sort=price&order=asc'
curl -s http://localhost:4000/api/v1/books/featured

# Upload cover
curl -s -X POST http://localhost:4000/api/v1/uploads/book-cover \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@./cover.jpg'

# Cart + checkout
curl -s -X POST http://localhost:4000/api/v1/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"bookId":"BOOK_ID","quantity":1}'

curl -s -X POST http://localhost:4000/api/v1/cart/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"shippingAddress":{"fullName":"Jane","line1":"1 Main","city":"Tehran","postalCode":"1000","country":"IR"},"discountCode":"WELCOME10"}'

# Favorites
curl -s -X POST http://localhost:4000/api/v1/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"bookId":"BOOK_ID"}'

# Admin dashboard
curl -s http://localhost:4000/api/v1/admin/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```


## Testing

Integration tests use **Vitest**, **supertest**, and **mongodb-memory-server** (no local Mongo required).

```bash
npm test
# or
npm run test:watch
```

The suite boots an in-memory MongoDB, runs a minimal seed (permissions, roles, admin, a few books, `WELCOME10`), and exercises HTTP flows against the real Express app (`src/app.ts`). JWT secrets and other env vars are set in `tests/setup-env.ts` — do not rely on `.env` for CI.

## Env

| Variable | Default | Notes |
|----------|---------|-------|
| `UPLOAD_DIR` | `uploads` | Local directory for multer storage; served at `/uploads` |

## Notes

- Access JWT is short-lived; refresh tokens are SHA-256 hashed in `RefreshToken` with rotation on refresh.
- Soft-deleted documents (`deletedAt`) are excluded from default queries.
- Order payment uses per-item stock decrement with `$gte` so stock cannot go negative; on failure the order moves to `failed` and any decrements are rolled back.
- Orders store `subtotalAmount`, `discountCode`, `discountAmount`, and `totalAmount`.
- Uploaded files land in `uploads/books/` (gitignored).
