# SK Kabunga-an Official App - Centralized Backend API

Production-ready Node.js + TypeScript backend for the **SK Kabunga-an Official App**. This service acts as the centralized online server, authentication provider, data backup store, and future synchronization engine for offline-first mobile Android clients.

---

## 1. What the Backend Is

The SK Kabunga-an backend provides a secure, modular REST API built with Fastify, TypeScript, Prisma ORM, and PostgreSQL. It is designed specifically to support offline-first operations where the Android application maintains local SQLite state and synchronizes data with this centralized server when connectivity is available.

---

## 2. Technology Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (v5+)
- **Web Framework**: Fastify v4 / v5
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v5
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

## 4. Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 14.0

---

## 5. Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd /workspace/clever-faraday
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 6. Environment Configuration

Copy `.env.example` to `.env` and fill in your environment variables:

```bash
cp .env.example .env
```

Configuration breakdown:
- `NODE_ENV`: Application environment (`development`, `production`, `test`)
- `PORT`: HTTP server port (default: `3000`)
- `HOST`: Bind address (default: `0.0.0.0`)
- `DATABASE_URL`: PostgreSQL connection URI (`postgresql://user:pass@localhost:5432/sk_kabungaan_db?schema=public`)
- `JWT_ACCESS_SECRET`: Secret key for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (min 32 chars)
- `JWT_ACCESS_EXPIRES_IN`: Access token expiration (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (e.g. `30d`)
- `CORS_ORIGIN`: Allowed origins (e.g. `http://localhost:3000,http://localhost:5173`)

---

## 7. PostgreSQL Setup

Create a PostgreSQL database and user:

```sql
CREATE DATABASE sk_kabungaan_db;
CREATE USER sk_user WITH ENCRYPTED PASSWORD 'sk_password';
GRANT ALL PRIVILEGES ON DATABASE sk_kabungaan_db TO sk_user;
```

---

## 8. Prisma Setup

Initialize database tables and generate Prisma Client:

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate
```

---

## 9. How to Generate Prisma Client

Whenever `prisma/schema.prisma` is modified, regenerate the TypeScript client:

```bash
npm run prisma:generate
```

---

## 10. How to Run Migrations

To apply database schema changes in development:

```bash
npm run prisma:migrate
```

To deploy migrations in production environments:

```bash
npm run prisma:deploy
```

To seed initial data (e.g., Super Admin user):

```bash
npm run prisma:seed
```

---

## 11. How to Start Development Mode

Start the server with hot-reloading:

```bash
npm run dev
```

---

## 12. How to Build for Production

Compile TypeScript into the `dist/` directory and start:

```bash
# Compile TypeScript
npm run build

# Start production server
npm run start
```

---

## 13. API Endpoint Overview

### Health Endpoint
- `GET /api/health` - Health status and database connectivity check.

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Create a new user/official account.
- `POST /api/auth/login` - Authenticate user and issue access & refresh tokens.
- `POST /api/auth/refresh` - Issue new access/refresh tokens via refresh token rotation.
- `POST /api/auth/logout` - Revoke current refresh token and log out.
- `GET /api/auth/me` - Get profile of authenticated user.

### Youth Records Endpoints (`/api/youth`)
- `GET /api/youth` - List youth records (with search, pagination, and filter parameters).
- `GET /api/youth/:id` - Get a specific youth record by UUID.
- `POST /api/youth` - Create a new youth record.
- `PUT /api/youth/:id` - Full update of a youth record.
- `PATCH /api/youth/:id` - Partial update of a youth record.
- `DELETE /api/youth/:id` - Soft delete a youth record.

---

## 14. Authentication Flow

```
Client                             Server                           PostgreSQL
  │                                  │                                   │
  ├─── POST /api/auth/login ────────►│                                   │
  │    { username, password }        ├─── Verify password hash (Argon2) ►│
  │                                  │◄── Return User Record ────────────┤
  │                                  │                                   │
  │◄── Return Access & Refresh ──────┤ (Store token hash & familyId)     │
  │    Tokens + User Info            │                                   │
  │                                  │                                   │
  ├─── GET /api/youth ──────────────►│                                   │
  │    Header: Bearer <AccessToken>  ├─── Verify Access Token ───────────┤
  │◄── Return Youth Data ────────────┤                                   │
```

---

## 15. Role System

Supported roles:
1. `SUPER_ADMIN` - Full system access across all endpoints and administrative settings.
2. `SK_CHAIRPERSON` - Executive oversight, manage officials, approve projects, manage records.
3. `SK_SECRETARY` - Manage youth records, meetings, documents, attendance.
4. `SK_TREASURER` - Manage financial records, inventory, budget items.
5. `SK_OFFICIAL` - Create & update youth records, view activities and projects.
6. `AUTHORIZED_USER` - Standard authenticated user access with read permissions.

---

## 16. Security Notes

- **Password Protection**: Passwords are hashed using Argon2id (with bcrypt fallback) with high cost parameters. Passwords and hashes are stripped from API outputs.
- **Refresh Token Rotation**: Each refresh token belongs to a token family. Reusing an old refresh token immediately revokes the entire family to prevent token hijacking.
- **SQL Injection Prevention**: Prisma ORM enforces parameterized queries for all operations.
- **HTTP Security**: Fastify Helmet configures essential security headers (HSTS, XSS Protection, No-Sniff, CSP).
- **Rate Limiting**: Integrated rate limiter protects endpoints from brute force and denial of service attacks.
- **Centralized Error Handler**: Internal tracebacks and database connection details are hidden in non-development environments.

---

## 17. Future Synchronization Architecture

The database schema is pre-configured for offline synchronization with the Android app:

```
+--------------------------+           +--------------------------+
|   Android Client (Local) |           |  Node.js + PostgreSQL    |
|   SQLite Data Store      |           |  Centralized Backend     |
+--------------------------+           +--------------------------+
|  id (UUID)               |           |  id (UUID)               |
|  createdAt, updatedAt    |<--------->|  createdAt, updatedAt    |
|  deletedAt (Soft Delete) |   Sync    |  deletedAt (Soft Delete) |
|  version                 |  Engine   |  version                 |
|  deviceId                | (Future)  |  deviceId, createdBy     |
+--------------------------+           +--------------------------+
```

Every major model includes:
- `id`: UUID primary key to avoid ID collision between client and server.
- `version`: Monotonically increasing counter for optimistic concurrency control.
- `deletedAt`: Soft-delete timestamp allowing deletions to propagate safely during sync.
- `deviceId`: Identifier of the originating device.
- `updatedBy` & `createdBy`: User attribution for multi-user synchronization.

---

## 18. Deployment Readiness Checklist

Before deploying the backend in Phase 3, ensure the following requirements are met:

- **Required Node.js Version**: Node.js `>= 20.0.0` (LTS recommended), npm `>= 10.0.0`
- **Database Requirements**: PostgreSQL database `>= 14.0` with standard connection URI format:
  `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public`
- **Required Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `HOST=0.0.0.0`
  - `DATABASE_URL` (PostgreSQL URI)
  - `JWT_ACCESS_SECRET` (at least 32 random characters)
  - `JWT_REFRESH_SECRET` (at least 32 random characters)
  - `JWT_ACCESS_EXPIRES_IN=15m`
  - `JWT_REFRESH_EXPIRES_IN=30d`
  - `CORS_ORIGIN` (specific domain or comma-separated list)
  - `SEED_ADMIN_USERNAME` (optional, default: `admin`)
  - `SEED_ADMIN_EMAIL` (optional)
  - `SEED_ADMIN_PASSWORD` (strong password for initial seeding)
- **Key Deployment Commands**:
  - **Build Command**: `npm run build`
  - **Migration Command**: `npm run prisma:deploy`
  - **Start Command**: `npm run start`
- **Health-Check Path**: `GET /api/health` (HTTP 200 when healthy with DB connected; HTTP 503 when DB disconnected)

---

## 19. API Request Examples (cURL)

Below are example `curl` commands for testing the API endpoints locally or in staging:

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

### 4. Get Current User Profile
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### 5. Create Youth Record
```bash
curl -X POST http://localhost:3000/api/youth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
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
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### 7. Update Youth Record (Partial PATCH)
```bash
curl -X PATCH http://localhost:3000/api/youth/<YOUTH_UUID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "workStatus": "EMPLOYED",
    "contactNumber": "09171234567"
  }'
```

### 8. Soft-Delete Youth Record
```bash
curl -X DELETE http://localhost:3000/api/youth/<YOUTH_UUID> \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```
