#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  ''|--seed) ;;
  *) printf 'Usage: bash scripts/setup.sh [--seed]\n' >&2; exit 2 ;;
esac

node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Use Node.js 24 (.nvmrc)."); process.exit(1) }'
docker compose version >/dev/null
umask 077
api=express-postgres-boilerplate
dashboard=nextjs-dashboard-boilerplate

if [[ ! -e "$api/.env" ]]; then
  secret=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  sed -E "s/^JWT_SECRET=.*/JWT_SECRET=$secret/; s/^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET)=.*/\1=/" "$api/.env.example" > "$api/.env"
fi
if [[ ! -e "$dashboard/.env.local" ]]; then
  secret=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  sed "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$secret/" "$dashboard/.env.example" > "$dashboard/.env.local"
fi

# Keep this command scoped to the development database shipped with Compose.
(
  cd "$api"
  npm ci
  node -r dotenv/config - <<'JS'
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[key])
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '5433' || url.pathname !== '/app_db' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(`${key} must target the local Compose database on port 5433`)
  }
}
JS
  docker compose up -d --wait db
  npm run prisma:migrate:deploy
  if [[ "${1:-}" == --seed ]]; then npm run seed:starter; fi
)
(cd "$dashboard" && npm ci)
