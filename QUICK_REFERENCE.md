# TeamSync - Quick Reference Card

## 🚀 Quick Start

```bash
# Start everything
docker-compose up --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx ts-node prisma/seed.ts

# Access
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Swagger:  http://localhost:4000/api/docs
PgAdmin:  http://localhost:5050
```

---

## 📁 Project Structure

```
TeamSync/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication
│   │   │   ├── user/          # User management
│   │   │   ├── organization/  # Organizations
│   │   │   ├── membership/    # Memberships
│   │   │   ├── project/       # Projects
│   │   │   ├── task/          # Tasks
│   │   │   ├── comment/       # Comments
│   │   │   ├── notification/  # Notifications
│   │   │   └── events/        # Event publishers
│   │   ├── worker/
│   │   │   └── notificationWorker.ts  # BullMQ worker
│   │   ├── config/            # Configuration
│   │   ├── shared/            # Middleware & errors
│   │   └── routes/            # Route aggregation
│   └── prisma/
│       └── schema.prisma      # Database schema
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/          # Login, Register
        │   ├── DashboardPage.tsx
        │   ├── ProjectsPage.tsx
        │   ├── TaskBoardPage.tsx
        │   ├── TaskDetailPage.tsx      # ✨ NEW
        │   ├── NotificationsPage.tsx   # ✨ NEW
        │   └── ProfilePage.tsx
        ├── components/        # Layout, ProtectedRoute, etc.
        ├── hooks/            # useAuth, useOrg
        └── lib/              # API client
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register    # Register with email/password
POST   /api/v1/auth/login       # Login with email/password
POST   /api/v1/auth/google      # Login with Google
POST   /api/v1/auth/refresh     # Refresh access token
```

### Users
```
GET    /api/v1/users/me         # Get current user
```

### Organizations
```
GET    /api/v1/organizations    # List user's organizations
POST   /api/v1/organizations    # Create organization
```

### Memberships
```
GET    /api/v1/memberships?organizationId=xxx  # List members
POST   /api/v1/memberships/invite               # Invite user
```

### Projects
```
GET    /api/v1/projects?organizationId=xxx     # List projects
POST   /api/v1/projects                         # Create project
```

### Tasks
```
GET    /api/v1/tasks?organizationId=xxx&projectId=yyy  # List tasks
POST   /api/v1/tasks                                    # Create task
PATCH  /api/v1/tasks/:id/status                         # Update status
PATCH  /api/v1/tasks/:id/assignee                       # Update assignee
```

### Comments
```
GET    /api/v1/comments?taskId=xxx              # List comments
POST   /api/v1/comments                         # Create comment
```

### Notifications
```
GET    /api/v1/notifications?organizationId=xxx&page=1&pageSize=20  # List
POST   /api/v1/notifications/:id/read                                # Mark read
```

---

## 🎯 Frontend Routes

```
/login                  # Login page
/register               # Register page
/                       # Dashboard (protected)
/projects               # Projects page (protected)
/tasks                  # Task board (protected)
/tasks/:taskId          # Task detail (protected) ✨ NEW
/notifications          # Notifications page (protected) ✨ NEW
/profile                # Profile page (protected)
```

---

## 🔔 Event Types

```javascript
// Published by backend, consumed by worker
TASK_ASSIGNED          // When task is assigned to user
TASK_STATUS_UPDATED    // When task status changes
COMMENT_ADDED          // When comment is added to task
USER_INVITED           // When user is invited to organization
```

---

## 🗄️ Database Models

```
User
├── email, passwordHash, name, provider
├── memberships[]
├── refreshTokens[]
├── notifications[]
├── assignedTasks[]
└── comments[]

Organization
├── name
├── memberships[]
├── projects[]
├── tasks[]
└── notifications[]

Membership
├── userId, organizationId, role
└── (ADMIN | MANAGER | MEMBER)

Project
├── organizationId, name, description
└── tasks[]

Task
├── organizationId, projectId, title, description
├── status (TODO | IN_PROGRESS | DONE)
├── assigneeId
└── comments[]

Comment
├── taskId, authorId, content
└── createdAt

Notification
├── userId, organizationId, type
├── title, body, data
└── read (boolean)

RefreshToken
├── userId, tokenHash
├── revoked, expiresAt
└── createdAt
```

---

## 🔐 Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend returns:
   - user object
   - accessToken (JWT, 15 min)
   - refreshToken (UUID, 7 days)
   ↓
3. Frontend stores in localStorage
   ↓
4. All API calls include: Authorization: Bearer {accessToken}
   ↓
5. On 401 error:
   - Try POST /auth/refresh with refreshToken
   - Get new tokens
   - Retry original request
   ↓
6. On refresh failure:
   - Clear storage
   - Redirect to /login
```

---

## 🎨 Key Components

### useAuth Hook
```typescript
const { user, accessToken, isAuthenticated, loading, setAuth } = useAuth();
```

### useOrg Hook
```typescript
const { org, setOrg } = useOrg();
```

### API Client
```typescript
import { api } from '../lib/api';
const { data } = await api.get('/tasks?organizationId=xxx');
```

### React Query
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['tasks', orgId],
  queryFn: async () => {
    const { data } = await api.get(`/tasks?organizationId=${orgId}`);
    return data;
  },
});
```

---

## 🛠️ Common Tasks

### Add New API Endpoint
1. Create route in `backend/src/modules/{module}/{module}.routes.ts`
2. Add validation schema (Zod)
3. Implement handler
4. Add to `backend/src/routes/index.ts`

### Add New Event Type
1. Add enum to `backend/prisma/schema.prisma`
2. Create publisher in `backend/src/modules/events/`
3. Add handler in `backend/src/worker/notificationWorker.ts`
4. Run migration: `npx prisma migrate dev`

### Add New Frontend Page
1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in `frontend/src/components/Layout.tsx`

---

## 🐛 Debugging

### Check Backend Logs
```bash
docker-compose logs -f backend
```

### Check Worker Logs
```bash
docker-compose logs -f worker
```

### Check Redis Queue
```bash
docker-compose exec redis redis-cli
KEYS *
LLEN bull:notifications:wait
```

### Check Database
```bash
docker-compose exec postgres psql -U postgres -d teamsync
\dt                    # List tables
SELECT * FROM "User";  # Query users
```

### Frontend Console
- F12 → Console (errors)
- F12 → Network (API calls)
- F12 → Application → Local Storage (auth tokens)

---

## 📦 Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/teamsync
REDIS_URL=redis://redis:6379
FRONTEND_URL=http://localhost:5173
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
SEED_ADMIN_EMAIL=admin@example.com
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🧪 Testing Checklist

- [ ] Register new user
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Create organization
- [ ] Invite member
- [ ] Create project
- [ ] Create task with assignee
- [ ] Update task status
- [ ] Click task card → view details
- [ ] Add comment on task
- [ ] View notifications dropdown
- [ ] View notifications page
- [ ] Mark notification as read
- [ ] Sign out

---

## 🎯 Key Features

✅ Multi-tenant architecture
✅ JWT + Refresh token auth
✅ Google OAuth integration
✅ Role-based access control
✅ Event-driven notifications
✅ Background job processing
✅ Real-time UI updates
✅ Kanban task board
✅ Task comments ✨
✅ Notification center ✨
✅ Docker deployment
✅ TypeScript everywhere

---

## 📚 Documentation Files

- `README.md` - Project overview
- `IMPLEMENTATION_STATUS.md` - Complete feature audit
- `TESTING_GUIDE.md` - Step-by-step testing
- `CHANGES_SUMMARY.md` - What was implemented
- `ARCHITECTURE_DIAGRAM.md` - Visual architecture
- `QUICK_REFERENCE.md` - This file

---

## 🆘 Common Issues

### Port already in use
```bash
# Find process
lsof -i :4000
# Kill process
kill -9 <PID>
```

### Database connection error
```bash
# Restart postgres
docker-compose restart postgres
# Check logs
docker-compose logs postgres
```

### Worker not processing jobs
```bash
# Check worker is running
docker-compose ps worker
# Restart worker
docker-compose restart worker
# Check Redis
docker-compose exec redis redis-cli ping
```

### Frontend can't reach backend
- Check CORS settings in `backend/src/app.ts`
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check backend is running: `curl http://localhost:4000/health`

---

## 💡 Pro Tips

1. **Use React Query DevTools** - Add to see cache state
2. **Check Swagger Docs** - http://localhost:4000/api/docs
3. **Use PgAdmin** - Visual database management
4. **Watch Worker Logs** - See notifications being created
5. **Use Browser DevTools** - Network tab for API debugging
6. **Hot Reload** - Use dev docker-compose for live updates

---

## 🎉 You're Ready!

TeamSync is fully implemented and ready to use. All features work end-to-end from frontend to backend to worker. Happy coding! 🚀
