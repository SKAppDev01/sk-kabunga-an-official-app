# Next Phase: First Live PostgreSQL Connection

The backend source is prepared for a real PostgreSQL database, but no live database credentials are included in this archive.

## 1. Configure `backend/.env`

Copy `.env.example` to `.env` and set private values locally. Never commit `.env`.

Required values:

- `DATABASE_URL` — real PostgreSQL URL; no placeholders
- `JWT_ACCESS_SECRET` — at least 32 random characters
- `JWT_REFRESH_SECRET` — at least 32 random characters
- `SEED_ADMIN_PASSWORD` — at least 12 characters

Run the safe configuration check:

```bash
npm run preflight
```

It reports only PASS/FAIL and never prints secret values.

## 2. Verify Prisma

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

## 3. First development migration

Only against a new/empty development database:

```bash
npx prisma migrate dev --name init
npx prisma migrate status
```

Never use `prisma migrate reset` on a database containing data.

## 4. Seed the first Super Admin

```bash
npm run prisma:seed
```

The seed reads `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` from `.env`.

## 5. Start and verify

```bash
npm run build
npm run dev
```

In another terminal:

```bash
curl http://127.0.0.1:3000/api/health
```

A working database should produce HTTP 200 with `database: "connected"`.

## Security behavior added before the live database phase

- Public registration cannot choose an elevated role.
- New public accounts are `AUTHORIZED_USER` and remain unverified by default.
- Youth-record endpoints require a verified account.
- JWT secrets have no built-in fallback values.
- JWT verification accepts only HS256.
- Wildcard CORS disables browser credentials.
