# SK Kabunga-an Official App - Centralized Backend API

Production-ready Node.js + TypeScript backend for the **SK Kabunga-an Official App**. This service acts as the centralized online server, authentication provider, data backup store, and future synchronization engine for offline-first mobile Android clients.

---

## 1. What the Backend Is

The SK Kabunga-an backend provides a secure, modular REST API built with Fastify, TypeScript, Prisma ORM, and PostgreSQL. It is designed specifically to support offline-first operations where the Android application maintains local SQLite state and synchronizes data with this centralized server when connectivity is available.

---

## 2. Technology Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (v5+)
- **Web Framework**: Fastify v5
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v5.22
- **Request Validation**: Zod
- **Authentication**: JWT (Access Tokens + Refresh Tokens with Rotation)
- **Password Hashing**: Argon2 (with bcrypt fallback)
- **Security**: `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/cookie`

---

## 3. Project Structure

```
.
├── prisma/
│   ├── schema.prisma       # Database schema & all 14 module models
│   └── seed.ts             # Initial admin seeding script
├── scripts/
│   └── test-api.sh         # Development API endpoint test script
├── src/
│   ├── config/
│   │   ├── database.ts     # Prisma client singleton & connection helper
│   │   └── env.ts          # Zod environment variable validation
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── health.controller.ts
│   │   └── youth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── role.middleware.ts
│   ├── repositories/
│   │   ├── audit.repository.ts
│   │   ├── refreshToken.repository.ts
│   │   ├── user.repository.ts
│   │   └── youth.repository.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── health.routes.ts
│   │   ├── index.ts
│   │   └── youth.routes.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── common.schema.ts
│   │   └── youth.schema.ts
│   ├── services/
│   │   ├── audit.service.ts
│   │   ├── auth.service.ts
│   │   └── youth.service.ts
│   ├── types/
│   │   └── auth.types.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── password.ts
│   ├── app.ts              # Fastify app setup & plugin registration
│   └── server.ts           # Server initialization & graceful shutdown
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## DATABASE SETUP

Follow these step-by-step instructions to set up PostgreSQL database connectivity:

1. **Create hosted PostgreSQL database**: Provision a PostgreSQL database (e.g. Neon, Supabase, AWS RDS, or local PostgreSQL instance >= 14).
2. **Copy connection string**: Copy the connection string format:
   `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require`
3. **Create backend/.env**: Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. **Add DATABASE_URL**: Set your PostgreSQL connection string in `backend/.env`:
   ```ini
   DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   ```
5. **Generate JWT secrets**: Generate strong 32+ character secrets for JWT tokens:
   ```ini
   JWT_ACCESS_SECRET="your_secure_random_access_secret_32_chars_min"
   JWT_REFRESH_SECRET="your_secure_random_refresh_secret_32_chars_min"
   ```
6. **Configure seed admin variables**: Set initial super admin credentials in `backend/.env`:
   ```ini
   SEED_ADMIN_USERNAME="admin"
   SEED_ADMIN_EMAIL="sk.kabungaan.admin@gmail.com"
   SEED_ADMIN_PASSWORD="YourStrongAdminPasswordHere"
   ```
7. **Run Prisma validation**: Validate the database schema syntax:
   ```bash
   npm run prisma:validate
   ```
8. **Run Prisma migration**: Create and apply initial database tables safely:
   ```bash
   npx prisma migrate dev --name init
   ```
9. **Run database seed**: Populate the initial Super Admin account:
   ```bash
   npm run prisma:seed
   ```
10. **Start backend**: Start the server:
    ```bash
    npm run dev
    ```
11. **Test /api/health**: Verify health check status and database connection:
    ```bash
    curl http://localhost:3000/api/health
    ```

---

## DEVELOPMENT WORKFLOW

For local development and testing:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Verify schema and format:
   ```bash
   npm run prisma:format
   npm run prisma:validate
   npm run prisma:generate
   ```
3. Start dev server with hot reload:
   ```bash
   npm run dev
   ```
4. Run automated API test script:
   ```bash
   TEST_ADMIN_PASSWORD="YourStrongAdminPasswordHere" ./scripts/test-api.sh
   ```

---

## PRODUCTION DEPLOYMENT WORKFLOW

To deploy the backend to a production Linux environment:

1. Install exact production dependencies:
   ```bash
   npm ci
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Deploy existing migrations (do **not** run `migrate dev` or `migrate reset` in production):
   ```bash
   npx prisma migrate deploy
   ```
4. Build TypeScript application:
   ```bash
   npm run build
   ```
5. Start production Node.js process:
   ```bash
   npm run start
   ```

---

## API Request Examples (cURL)

Below are safe example commands using placeholders (`YOUR_ACCESS_TOKEN`, `YOUR_REFRESH_TOKEN`, `<YOUTH_UUID>`):

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "<YOUR_ADMIN_PASSWORD>"
  }'
```

### 3. Refresh Access Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<YOUR_REFRESH_TOKEN>"
  }'
```

### 4. Current User Profile
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create Youth Record
```bash
curl -X POST http://localhost:3000/api/youth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Juan",
    "middleName": "Santos",
    "lastName": "Dela Cruz",
    "birthDate": "2002-05-15T00:00:00.000Z",
    "sex": "MALE",
    "civilStatus": "SINGLE",
    "address": "Purok 1, Barangay Kabunga-an",
    "purok": "Purok 1",
    "barangay": "Kabunga-an",
    "educationalBackground": "COLLEGE",
    "workStatus": "STUDENT",
    "isRegisteredVoter": true,
    "isSkVoter": true
  }'
```

### 6. List Youth Records
```bash
curl -X GET "http://localhost:3000/api/youth?page=1&limit=20&purok=Purok%201&sortBy=lastName&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Update Youth Record (Partial PATCH)
```bash
curl -X PATCH http://localhost:3000/api/youth/<YOUTH_UUID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "workStatus": "EMPLOYED",
    "contactNumber": "09171234567"
  }'
```

### 8. Soft-Delete Youth Record
```bash
curl -X DELETE http://localhost:3000/api/youth/<YOUTH_UUID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Role System & Security

Supported roles:
1. `SUPER_ADMIN` - Full system access across all endpoints and administrative settings.
2. `SK_CHAIRPERSON` - Executive oversight, manage officials, approve projects, manage records.
3. `SK_SECRETARY` - Manage youth records, meetings, documents, attendance.
4. `SK_TREASURER` - Manage financial records, inventory, budget items.
5. `SK_OFFICIAL` - Create & update youth records, view activities and projects.
6. `AUTHORIZED_USER` - Standard authenticated user access with read permissions.

Security Enforcement:
- **Password Protection**: Argon2id with bcrypt fallback.
- **Token Rotation**: Refresh token family rotation with automatic reuse detection & revocation.
- **Query Parameterization**: Enforced via Prisma ORM.
- **Graceful Error Handling**: Database internals and secrets are suppressed from error payloads.
