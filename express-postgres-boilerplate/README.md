# Pern Boilerplate

A reusable Express + Prisma starter with a modular `routes -> controllers -> services` architecture, strict tenant isolation, RBAC, JWT auth, and documented endpoints. It ships with an Organizer/Event/Booking sample domain so you can see the patterns in action and swap it with your own.

Sample domain mapping (replace as needed):
- **Organizer** = Tenant / organizer account
- **Event** = Public event listing
- **Booking** = Ticket purchase / reservation

---

## Features

- **Multi-tenant Organizer + Event models** with strict tenant isolation
- **RBAC roles**: ADMIN, OWNER, STAFF, USER with minimal-privilege checks
- **Bookings linked to events** (organizer derived via event)
- **Prisma ORM** with PostgreSQL migrations and seed data (organizer, events, staff, booking)
- **JWT authentication** with rotating refresh tokens and Redis-backed access-token blacklisting
- **Stripe payments** with Checkout Session + webhook reconciliation
- **Analytics dashboards** for bookings, payments, events, users, and staff
- **Cloudinary uploads** example
- **OpenAPI documentation** via Swagger UI with JWT persistence
- **Request validation** with Zod + xss sanitization
- **Production-ready middleware** (rate limiting, Helmet, compression, CORS)
- **Structured logging** with Pino and request IDs
- **Environment-driven app metadata** (name/description) for easy reuse

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL + Prisma Client
- **Cache/Auth Revocation:** Redis via ioredis
- **Auth:** JWT access + refresh tokens with RBAC and access-token revocation
- **Payments:** Stripe Checkout Sessions
- **Analytics:** Prisma + raw SQL aggregations with Redis-backed response caching
- **Uploads:** Multer + Cloudinary
- **Validation & Sanitization:** Zod + xss
- **Docs:** swagger-jsdoc + swagger-ui-express
- **Tooling:** Nodemon, ts-node, dotenv

---

## Project Structure

```text
.
|-- prisma/
|   |-- schema.prisma        # Database schema and Prisma configuration
|   |-- seed.ts              # Seed script for initial data
|-- src/
|   |-- app.ts               # Express app setup, middleware, health check, swagger
|   |-- server.ts            # HTTP server bootstrap and graceful shutdown
|   |-- controllers/         # Request handlers
|   |-- middleware/          # Auth, validation, request ID, swagger, error handling
|   |-- routes/              # Express routers grouped by domain
|   |-- schemas/             # Zod validation schemas
|   |-- services/            # Organizer/event logic, Prisma access, cache integration
|   |-- types/               # Shared TypeScript types and Express augmentation
|   |-- utils/               # Logger, Prisma client, cache, Cloudinary, Stripe, env helpers
|-- .env.example             # Environment variable template
|-- nodemon.json             # Development watcher configuration
|-- package.json             # Scripts and dependencies
|-- tsconfig.json            # TypeScript configuration
```

---

## Using This as a Boilerplate

- Copy `.env.example` to `.env` and update template placeholders:
  - `APP_NAME`
  - `APP_DESCRIPTION`
  - `JWT_ISSUER`
- Replace the Organizer/Event/Booking sample modules with your own domain models.
- Remove optional integrations you don't need (Stripe, Cloudinary, Redis) and their routes/dependencies.
- Update the project folder/repository name (`pern-boilerplate`) to your own app name.
- Refresh Swagger docs/examples to match your endpoints.

---

## Getting Started

### Prerequisites

- **Node.js 20 or newer**
- **Docker and Docker Compose** (for Docker-based local flow)
- Optional providers: Stripe (payments), Cloudinary (uploads)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd pern-boilerplate
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

`.env.example` includes values for both non-Docker and Docker Compose flows.

Core variables you must set:
- `JWT_SECRET` (required, minimum 16 chars)
- `APP_NAME`, `APP_DESCRIPTION`, `JWT_ISSUER` (template/project naming)
- `DATABASE_URL` and `DIRECT_URL` for non-Docker API runs

Docker Compose DB defaults are also included:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DB_PORT` (host mapping, default `5433`)

Optional integrations:
- Redis: `REDIS_URL` (required in production for durable auth/session revocation)
- Stripe: `STRIPE_*`
- Cloudinary: `CLOUDINARY_*`

### 4. Run PostgreSQL With Docker Compose

```bash
# Start PostgreSQL
docker compose up -d
```

PostgreSQL will be available on `localhost:5433` by default.

Stop and remove containers:

```bash
docker compose down
```

Stop and remove containers + DB volume:

```bash
docker compose down -v
```

### 5. Run Without Docker (Local Node + Host DB)

Start PostgreSQL in Docker:

```bash
docker compose up -d
```

Apply schema and seed data:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

Start API in watch mode:

```bash
npm run dev
```

Or run compiled build:

```bash
npm run build
npm start
```

### 6. Migrations and Seed

Run local development migrations:

```bash
npm run prisma:migrate
npm run seed
```

Apply committed migrations in production:

```bash
npm run prisma:migrate:deploy
```

### 7. API Documentation

- Swagger UI: `GET /api-docs`
- Health: `GET /health`

---

## Usage Examples

```bash
# Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample User","email":"user@example.com","password":"Password123!"}'

# Create an organizer (OWNER/Admin with a valid token)
curl -X POST http://localhost:8080/api/organizers \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Organizer"}'
```

---

## Available Scripts

### Development & Build
- `npm run dev` - Start the API with Nodemon + ts-node
- `npm run build` - Compile TypeScript into `dist/`
- `npm start` - Run the compiled build

### Database & Prisma
- `npm run prisma:generate` - Regenerate Prisma Client
- `npm run prisma:migrate` - Run interactive migrations (`prisma migrate dev`)
- `npm run prisma:migrate:deploy` - Apply committed migrations in production
- `npm run prisma:studio` - Launch Prisma Studio (http://localhost:5555)
- `npm run seed` - Execute the Prisma seed script

---

## API Endpoints

### Authentication

| Method | Path                 | Description                        | Auth |
| ------ | -------------------- | ---------------------------------- | ---- |
| POST   | `/api/auth/register` | Register a new user (USER role)    | No   |
| POST   | `/api/auth/login`    | Login and receive a JWT            | No   |
| GET    | `/api/auth/me`       | Get the current user profile       | Yes  |

### Organizers

| Method | Path                                       | Description                                   | Auth |
| ------ | ------------------------------------------ | --------------------------------------------- | ---- |
| POST   | `/api/organizers`                          | Create an organizer (OWNER or ADMIN)          | Yes  |
| GET    | `/api/organizers/:organizerId`             | Get an organizer profile (owner/staff/admin)  | Yes  |
| PATCH  | `/api/organizers/:organizerId`             | Update organizer profile (owner/staff/admin)  | Yes  |
| GET    | `/api/organizers/:organizerId/events`      | List events (published for non-owner)         | Yes  |
| POST   | `/api/organizers/:organizerId/events`      | Create event (owner/admin)                    | Yes  |
| PATCH  | `/api/organizers/:organizerId/events/:eventId` | Update event (owner/admin)                 | Yes  |
| DELETE | `/api/organizers/:organizerId/events/:eventId` | Delete event (owner/admin)                 | Yes  |
| GET    | `/api/organizers/:organizerId/staff`       | List staff assignments (owner/admin)          | Yes  |
| POST   | `/api/organizers/:organizerId/staff`       | Assign staff (owner/admin)                    | Yes  |
| DELETE | `/api/organizers/:organizerId/staff/:userId`| Remove staff (owner/admin)                   | Yes  |

### Bookings

| Method | Path                   | Description                                      | Auth |
| ------ | ---------------------- | ------------------------------------------------ | ---- |
| GET    | `/api/bookings`        | List bookings (admin sees all, users see theirs) | Yes  |
| POST   | `/api/bookings`        | Create a booking (published events for USER)     | Yes  |
| GET    | `/api/bookings/:id`    | Get booking details by ID                        | Yes  |
| PATCH  | `/api/bookings/:id`    | Update a booking (booking owner or admin)        | Yes  |
| DELETE | `/api/bookings/:id`    | Delete a booking (admin only)                    | Yes  |

### Analytics

| Method | Path                       | Description                                                   | Auth |
| ------ | -------------------------- | ------------------------------------------------------------- | ---- |
| GET    | `/api/analytics/overview`  | Cross-domain overview for the allowed tenant scope            | Owner/Staff/Admin |
| GET    | `/api/analytics/bookings`  | Booking totals, status breakdowns, revenue, trends, top events| Owner/Staff/Admin |
| GET    | `/api/analytics/payments`  | Payment totals, success rates, revenue-by-status, trends      | Owner/Staff/Admin |
| GET    | `/api/analytics/events`    | Event counts, publication split, pricing, popular events      | Owner/Staff/Admin |
| GET    | `/api/analytics/users`     | Registration trends, active roles, staff performance          | Owner/Staff/Admin |

### Payments & Uploads

| Method | Path                              | Description                         | Auth |
| ------ | --------------------------------- | ----------------------------------- | ---- |
| POST   | `/api/payments/checkout-session`  | Create a Stripe Checkout session   | Yes  |
| GET    | `/api/payments/history`           | List payments for current user     | Yes  |
| POST   | `/api/uploads/image`              | Upload an image via Cloudinary     | Yes  |

### Users (Admin)

| Method | Path                 | Description                              | Auth |
| ------ | -------------------- | ---------------------------------------- | ---- |
| GET    | `/api/users`         | List users (paginated)                   | Admin |
| POST   | `/api/users`         | Create a new user                        | Admin |
| GET    | `/api/users/:id`     | Get user details (admin or self)         | Yes  |
| PATCH  | `/api/users/:id`     | Update user profile (admin or self)      | Yes  |
| PATCH  | `/api/users/:id/role`| Update user role                         | Admin |
| DELETE | `/api/users/:id`     | Delete a user                            | Admin |

### Utility

| Method | Path        | Description                                  | Auth |
| ------ | ----------- | -------------------------------------------- | ---- |
| GET    | `/health`   | Service health check                         | No   |
| GET    | `/api-docs` | Interactive Swagger UI documentation         | No   |

---

## Authentication and RBAC

### Roles
- **ADMIN**: Full access across all tenants
- **OWNER**: Owns exactly one organizer and manages events/staff
- **STAFF**: Assigned to an organizer; limited profile access
- **USER**: Can only interact with published events

### Notes
- Tenant checks are enforced in the service layer.
- Controllers remain thin and contain no auth logic.
- Access tokens are validated against the current user role and permissions, not just the original JWT claims.
- `POST /api/auth/refresh` rotates the refresh token and can blacklist the previous access token when the current bearer token is sent.
- `POST /api/auth/logout` revokes the refresh token and blacklists the current access token when the current bearer token is sent.

---

## Database Schema & Seed Data

### Prisma Models
- **User**: Authentication, roles, profile data
- **Organizer**: Tenant owned by an OWNER
- **Event**: Event catalog entries under an organizer
- **OrganizerStaff**: Staff assignments per organizer
- **Booking**: Ticket purchases linked to events
- **Payment**: Stripe payment records
- **Analytics**: Aggregated reporting built from the core domain tables

### Database Management
```bash
npm run prisma:studio
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:migrate:deploy
```

### Analytics Testing Examples

Basic analytics testing examples live in `docs/analytics-testing-examples.md`.

---

Happy building.
