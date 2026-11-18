# Multi-tenant PERN starter

This starter pairs an Express and Prisma API in `express-postgres-boilerplate`
with a Next.js dashboard in `nextjs-dashboard-boilerplate`.

## Local development

Install Node.js 24 (or run `nvm use`) and Docker with Compose v2. Then run:

```bash
bash scripts/setup.sh --seed
```

The script creates missing local env files, installs locked dependencies,
starts PostgreSQL on loopback port 5433, and applies committed migrations.
Use `--seed` to populate the small Projects demo in this local database.
Subsequent setup runs can omit the flag to keep existing demo data as-is.
The first install needs registry access and access to Prisma's engine host.

Start the apps in separate terminals:

```bash
cd express-postgres-boilerplate && npm run dev
```

```bash
cd nextjs-dashboard-boilerplate && npm run dev
```

Open `http://localhost:3000/login` and use the local seed account
`owner@example.com` with password `changeMeOwner1!`. The Projects page
lets you list, create, rename, and delete projects for your organizer. A
second organizer (`owner2@example.com`) and an assigned staff account
(`staff1@example.com`) use the same local demo password.

The API serves
`/health` and `/api-docs` on port 8080.

GitHub Actions checks the dashboard and API independently and applies
migrations to a fresh PostgreSQL service.

The original events, bookings, and analytics routes remain available.
They use the older full demo dataset, which you can load with `npm run
seed` from the API directory. That seed **resets application tables** and
is intended for a disposable development database.

See the [deployment guide](docs/deployment.md) for hosting, release, and rollback steps.
