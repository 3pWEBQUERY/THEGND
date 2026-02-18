# The GND — Development & Deployment Notes

## Local Development
- Install deps:
  ```bash
  npm install
  ```
- Run dev server:
  ```bash
  npm run dev
  ```
- Type check:
  ```bash
  npx tsc -p tsconfig.json --noEmit
  ```

## Prisma & Database
- Generate Prisma Client:
  ```bash
  npx prisma generate
  ```
- Apply schema changes locally (creates a new migration and applies it to your dev DB):
  ```bash
  npx prisma migrate dev -n <migration_name>
  ```
- Inspect prisma schema at `prisma/schema.prisma` and migrations in `prisma/migrations/`.

### Opening Hours (Agencies)
- Profile model has an optional field `openingHours` (JSON string) to store weekly opening hours.
- Onboarding Agency Step-1 supports opening hours entry (Mon–Sun) and persists via the API route.

## DigitalOcean App Platform — Release Phase (Migrations in Production)
To ensure database migrations are applied on each deploy, configure a Release Phase command in your DO App:

1. In your DO App, go to "Deployments" → "Settings" → "Release Phase".
2. Set the command to:
   ```bash
   npm run migrate:deploy
   ```
3. Make sure your production DATABASE_URL is set in the App's environment variables.

This runs `prisma migrate deploy` after the build and before switching traffic to the new release, keeping the schema in sync.

## Build Scripts
- `npm run build`: runs `prisma generate` and then `next build`.
- `npm run migrate:deploy`: runs `prisma migrate deploy` (used in DO Release Phase).

## Environment Variables
- `.env` for local development, set at least:
  - `DATABASE_URL` — Postgres connection string
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — for embed map on profile pages
- Production env vars must be set in the hosting provider (e.g., DO App → Settings → Environment Variables).

## Notes on Social Buttons
- Agency and Escort profile pages render Social links as icon buttons.
- WhatsApp entries are normalized to `https://wa.me/<phone>`.
- Non-URL values are normalized to `https://...`.

## Linting
```bash
npm run lint
```
