# Deploy the PERN starter

Deploy the dashboard and API as two Node.js 24 services. Use managed
PostgreSQL and Redis. Redis is required by the API's production configuration
for shared session state. Keep database and Redis traffic private.

## Build and start

Deploy both apps from the same reviewed commit. Use these directories as the
service roots:

| Service | Working directory | Build | Start |
| --- | --- | --- | --- |
| API | `express-postgres-boilerplate` | `npm ci --include=dev && npm run build` | `npm start` |
| Dashboard | `nextjs-dashboard-boilerplate` | `npm ci --include=dev && npm run build` | `npm start` |

Configure runtime values in the hosting provider's environment settings.
Give each environment its own database, Redis instance or namespace, and secrets.

- API: set `NODE_ENV=production`, `HOST=0.0.0.0`, and use the platform's
  designated `PORT`. Set `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, and a
  generated `JWT_SECRET`. For `CORS_ORIGIN` use the exact dashboard HTTPS
  origin. Set `COOKIE_SECURE=true`. Review `COOKIE_SAME_SITE` if the
  frontend and API use different sites.
- Dashboard: supply `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` with the
  dashboard HTTPS URL, plus `NEXT_PUBLIC_API_BASE_URL` with the API HTTPS
  URL. Supply public values during the build. Set a generated `AUTH_SECRET`
  in the provider's build and runtime environment. Keep secrets in the
  provider's secret store.
- Use separate private values for staging and production. Provision the
  first production user and organizer through an operator-controlled process.
  The starter and legacy seed commands are for local development databases.

The application's [API env example](../express-postgres-boilerplate/.env.example)
and [dashboard env example](../nextjs-dashboard-boilerplate/.env.example)
list the optional provider settings.

## Release and verify

1. Build both apps and wait for CI. Confirm a current PostgreSQL backup
   before applying production schema changes.
2. From the API build directory, run `npm run prisma:migrate:deploy` once in
   the hosting provider's release job. Use the same commit and installed
   Prisma CLI as the API build. Start the new API and dashboard after the
   migration succeeds. Use backward-compatible migrations for rolling deploys.
3. Request the API's `/health` endpoint and confirm both database and cache
   report `up`. Then sign in through the dashboard over HTTPS and verify that
   a test account can list and edit projects for its own organizer.
4. Record the deployed commit and retain the previous app releases. If a
   release fails, redeploy the previous API and dashboard together if they
   support the current schema. For an incompatible migration, follow the
   database recovery plan or ship a corrective migration. App rollback alone
   leaves committed database migrations in place.

The root GitHub Actions workflow handles portable CI. Service URLs, secrets,
and production deployment are configured per derived project.
