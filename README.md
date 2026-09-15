# Bookstore API

Node.js + TypeScript + Express + Mongoose backend with JWT auth, RBAC, books, reviews, orders (fake payments + stock), cart, favorites, discount codes, local image uploads, and admin dashboard.

> **Breaking change:** all business routes are under **`/api/v1/...`**. Health remains at `/api/health`; Swagger at `/api/docs`.

## Architecture (DDD-inspired layers)

```
src/
  domain/              # Entities, ports, pure rules, VOs, DomainError, events
  application/         # Services, focused use-cases, DTOs, application ports
  infrastructure/      # Mongoose, storage, logger, notifier, composition/
  interfaces/http/
    v1/                # Controllers, routes, validators, presenters
    middleware/        # Errors, upload, request id, security/
    docs/modules/      # Split OpenAPI path files
  shared/              # AppError, Domain→HTTP map, asyncHandler, pagination
  scripts/seed.ts      # Seed stays here (see docs/architecture.md)
  app.ts
  server.ts
```

- **Domain** must not import Express, Mongoose, infrastructure, or interfaces (ESLint boundary rules).
- Controllers call **application** services / use-cases; services depend on **domain repository ports**.
- Wiring: `infrastructure/composition/` (`repos`, `infra`, `services`).
- Details: [docs/architecture.md](docs/architecture.md) · [docs/modules.md](docs/modules.md)

## Stack

- Express 5, Mongoose, Zod, Helmet, express-rate-limit, multer
- bcryptjs, jsonwebtoken, dotenv, cors, morgan
- swagger-ui-express (OpenAPI at `/api/docs`)
- ESLint + Prettier, tsx for dev, tsc-alias for path aliases
- Vitest + supertest + mongodb-memory-server (Mongo binary pinned to **7.0.14**)

## Setup

```bash
cp .env.example .env
npm install
# start MongoDB locally (mongodb://127.0.0.1:27017/bookstore)
npm run seed
npm run dev
```

Default admin (from seed):

- Email: `admin@bookstore.local`
- Password: `Admin123!`

Sample discount codes: `WELCOME10` (10% off, min $20), `FLAT5` ($5 off, min $15).

## Docker

```bash
docker build -t nodejs-bookshop .
docker run --rm -p 4000:4000 --env-file .env nodejs-bookshop
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch |
| `npm run build` | `tsc` + `tsc-alias` |
| `npm start` | run compiled server |
| `npm run lint` | ESLint (src + tests) |
| `npm run format` | Prettier |
| `npm run seed` | permissions, roles, admin, 40 imaged books, discounts |
| `npm test` | unit + integration (Vitest) |
| `npm run test:watch` | Vitest watch |

## Path aliases

`@domain/*`, `@application/*`, `@infrastructure/*`, `@interfaces/*`, `@shared/*` (tsconfig + Vitest + tsc-alias).

## Key routes

### Unversioned

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | health |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs.json` | OpenAPI JSON |

### Auth — `/api/v1/auth`

| Method | Path | Auth |
|--------|------|------|
| POST | `/register` | public |
| POST | `/login` | public |
| POST | `/refresh` | public |
| POST | `/logout` | public |

### Books — `/api/v1/books`

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | public (search/filter) |
| GET | `/featured` | public |
| GET | `/:id` | public |
| POST / PATCH / DELETE | `/`, `/:id` | staff permissions |

### Cart — `/api/v1/cart`

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | bearer |
| POST | `/items` | bearer |
| PATCH / DELETE | `/items/:bookId` | bearer |
| DELETE | `/` | clear |
| POST | `/checkout` | `orders:create` |

### Orders — `/api/v1/orders`

| Method | Path | Auth |
|--------|------|------|
| POST | `/` | `orders:create` |
| GET | `/` | own or all |
| GET | `/:id` | own or all |
| POST | `/:id/pay` | owner / staff |
| PATCH | `/:id/status` | `orders:update-status` |

Also: favorites, discounts, reviews, users, roles, permissions, reports, uploads, admin dashboard — see Swagger.

## Seed & cover images

`npm run seed` upserts permissions, roles, admin, **40 books** with Open Library covers, featured flags, and sample discounts (idempotent by ISBN).

## Book search

`GET /api/v1/books` supports `q`, `category`, `minPrice`/`maxPrice`, `inStock`, `featured`, `sort`, `order`, `page`/`limit`. Dedicated: `GET /api/v1/books/featured`.

## Tests & CI

- Unit: `tests/unit/` (domain rules + key use-cases)
- Integration: `tests/integration/` (supertest + MongoMemoryServer **7.0.14**)
- GitHub Actions: `.github/workflows/ci.yml` (lint, build, test)

## License

MIT
