# Runbook

## First-time local setup

```bash
cd grand-horizon-hotel
cp .env.example .env
npm install
docker compose up -d
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Reset local database

```bash
npm run db:push -- --force-reset
npm run db:seed
```

## Environment variables

`DATABASE_URL` must point to a PostgreSQL database. The default Docker Compose database URL is:

```bash
postgresql://postgres:postgres@localhost:5432/hotel_admin_db?schema=public
```

`JWT_SECRET` must be at least 32 characters. Use a strong random value outside local development.

## Common operations

- Open Prisma Studio: `npm run db:studio`
- Generate Prisma client: `npm run db:generate`
- Run local app: `npm run dev`
- Build app: `npm run build`

## Troubleshooting

If login fails after changing seed data, run:

```bash
npm run db:seed
```

If Prisma cannot connect, verify Docker is running:

```bash
docker compose ps
```
