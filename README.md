### TeamSync – Multi-tenant Collaboration Platform

TeamSync is a production-grade SaaS starter for multi-tenant project and task collaboration with event-driven notifications.

### Tech Stack

- **Backend**: Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, BullMQ, JWT, Google OAuth, Zod, Pino, Jest, Swagger
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, React Router, React Query, Axios
- **Infra**: Docker, docker-compose, GitHub Actions CI

### High-level Architecture

- **Modular monolith backend** under `backend/src` with clear module boundaries (`auth`, `organization`, `project`, `task`, `notification`, `events`, `worker`).
- **Background worker** using BullMQ to process notification jobs from Redis.
- **PostgreSQL + Prisma** for relational, multi-tenant data with organization scoping.
- **React SPA frontend** with protected routes, basic dashboard shell, and Google OAuth integration.

### Folder Structure (key parts)

- **`backend/`**
  - `src/`
    - `index.ts` – HTTP server bootstrap
    - `app.ts` – Express app, middleware, routing, Swagger
    - `config/` – logger, Prisma, Redis, BullMQ, Swagger
    - `shared/` – common errors and middleware
    - `modules/`
      - `auth/` – email/password & Google login, refresh tokens
      - `organization/` – org CRUD, membership seeding
      - `project/` – org-scoped projects
      - `task/` – tasks with status, assignment, events
      - `notification/` – in-app notification queries
      - `events/` – domain event publishers to BullMQ
    - `worker/notificationWorker.ts` – BullMQ worker for notifications
    - `docs/openapi.yaml` – minimal OpenAPI spec
  - `prisma/schema.prisma` – models & enums
  - `prisma/seed.ts` – seed demo org and admin
  - `Dockerfile`, `Dockerfile.worker`
- **`frontend/`**
  - Vite React app with Tailwind
  - `src/App.tsx` – routes and layout
  - `src/pages/` – auth, dashboard, projects, task board, profile
  - `src/components/` – layout, protected route, notifications dropdown
  - `src/hooks/useAuth.tsx` – simple auth context
  - `Dockerfile`
- **Root**
  - `.env.example` – environment variables
  - `docker-compose.yml`
  - `.github/workflows/ci.yml`

### ER Diagram (conceptual)

- **User**
  - Has many **Memberships**
  - Has many **RefreshTokens**
  - Has many **Notifications**
  - Has many **Comments**
  - Has many **AuditLogs**
- **Organization**
  - Has many **Memberships**
  - Has many **Projects**
  - Has many **AuditLogs**
- **Membership**
  - Join table: `User` ↔ `Organization` with `role: Role`
- **Project**
  - Belongs to one `Organization`
  - Has many `Task`
- **Task**
  - Belongs to one `Project`
  - Belongs to one `Organization` (denormalized for scoping)
  - Has optional `assignee: User`
  - Has many `Comment`
- **Comment**
  - Belongs to `Task`
  - Belongs to `User` (author)
- **Notification**
  - Belongs to `User`
  - Belongs to `Organization`
  - Has `type: NotificationType`, `data: Json`
- **RefreshToken**
  - Belongs to `User`
- **AuditLog**
  - Optional `Organization` and `User`

This schema supports:

- Multi-tenancy via `organizationId` on org-scoped models.
- Many-to-many user–organization via `Membership` and `Role`.
- Event-driven notifications attached to users and organizations.

### Environment Variables

Copy `.env.example` to `.env` and set:

- **Core**
  - `NODE_ENV` – `development` or `production`
  - `PORT` – backend port (default `4000`)
  - `DATABASE_URL` – PostgreSQL connection string
  - `REDIS_URL` – Redis connection string
  - `FRONTEND_URL` – frontend origin (CORS)
- **Auth**
  - `JWT_ACCESS_SECRET` – strong secret for access tokens
  - `JWT_REFRESH_SECRET` – strong secret for refresh tokens
  - `GOOGLE_CLIENT_ID` – Google OAuth client ID
- **Seed**
  - `SEED_ADMIN_EMAIL` – email for seeded admin user
- **Frontend (Vite)**
  - `VITE_API_BASE_URL` – e.g. `http://localhost:4000/api/v1`
  - `VITE_GOOGLE_CLIENT_ID` – same Google client ID as above

### Running Locally with Docker

1. **Create `.env`**  
   Copy `.env.example` to `.env` and fill in secrets.

2. **Start the stack**

   ```bash
   docker-compose up --build
   ```

3. **Apply Prisma migrations and seed**

   In another terminal inside the `backend` container:

   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx ts-node prisma/seed.ts
   ```

4. **Access services**

- Backend API: `http://localhost:4000/api/v1`
- Swagger docs: `http://localhost:4000/api/docs`
- Frontend: `http://localhost:5173`

### Docker dev mode (live reload)

Run the full stack in Docker with **hot reload**: code changes in `backend/` and `frontend/` are picked up without rebuilding images.

1. **First time only – install deps in containers** (populates the dev volumes):

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm backend npm install
   docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm frontend npm install
   ```

2. **Start the stack in dev mode**

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

3. **Use the app**

   - Frontend: `http://localhost:5173` (Vite HMR)
   - Backend: `http://localhost:4000` (ts-node-dev restarts on change)

   Edit files under `backend/src` or `frontend/src` and save; the running containers will reload.

4. **Stop dev stack**

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml down
   ```

### Running Locally without Docker

1. **Install dependencies**

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Postgres and Redis** (e.g., via Docker or local services) and set `DATABASE_URL`/`REDIS_URL`.

3. **Run migrations and seed**

   ```bash
   cd backend
   npx prisma migrate dev
   npx ts-node prisma/seed.ts
   ```

4. **Start backend and worker**

   ```bash
   cd backend
   npm run dev
   npm run worker
   ```

5. **Start frontend**

   ```bash
   cd frontend
   npm run dev
   ```

### Architecture Decisions (Summary)

- **Modular monolith**: All business logic is in clearly separated modules under `backend/src/modules`, sharing a single codebase and DB to simplify deployment while preserving boundaries.
- **Multi-tenancy via `organizationId`**: All org-scoped entities carry an `organizationId` for safe filtering; `Membership` enforces user access and roles.
- **Event-driven notifications**: Domain events (e.g., task assigned, status changed) publish lightweight payloads to a BullMQ queue; a dedicated worker creates durable `Notification` records and can be extended to email, webhooks, etc.
- **JWT + refresh rotation**: Short-lived access tokens plus DB-backed refresh tokens (rotated on each use) balance security with UX; refresh tokens can be revoked per user.
- **React SPA + API**: A minimal but professional dashboard shell with protected routing, ready to be extended with richer project, task, and notification UX.

