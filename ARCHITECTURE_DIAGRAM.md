# TeamSync - Complete Architecture Diagram

## 🏗️ System Architecture (All Features Implemented)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Login Page   │  │Register Page │  │ Google OAuth │  │Profile Page │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │Dashboard Page│  │Projects Page │  │Task Board    │  │Task Detail  │ │
│  │- Org Stats   │  │- Create Proj │  │- Kanban View │  │- Comments ✨│ │
│  │- Task Stats  │  │- Invite User │  │- Status Upd  │  │- Status Upd │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────┐ │
│  │Notifications │  │         Layout Component                          │ │
│  │Page ✨       │  │  - Sidebar Navigation                             │ │
│  │- Unread      │  │  - NotificationsDropdown (Header)                 │ │
│  │- Read        │  │  - Protected Routes                               │ │
│  └──────────────┘  └──────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Hooks & Context                                      │   │
│  │  - useAuth (JWT + Refresh Token)                                  │   │
│  │  - useOrg (Organization Context)                                  │   │
│  │  - React Query (Data Fetching & Caching)                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │ (Axios + Interceptors)
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        API Routes (/api/v1)                          │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  /auth                                                                │  │
│  │    POST /register        - Email/password registration               │  │
│  │    POST /login           - Email/password login                      │  │
│  │    POST /google          - Google OAuth login                        │  │
│  │    POST /refresh         - Refresh token rotation                    │  │
│  │                                                                       │  │
│  │  /users                                                               │  │
│  │    GET  /me              - Current user profile                      │  │
│  │                                                                       │  │
│  │  /organizations                                                       │  │
│  │    GET  /                - List user's organizations                 │  │
│  │    POST /                - Create organization                       │  │
│  │                                                                       │  │
│  │  /memberships                                                         │  │
│  │    GET  /?organizationId - List members                              │  │
│  │    POST /invite          - Invite user (ADMIN/MANAGER only)          │  │
│  │                                                                       │  │
│  │  /projects                                                            │  │
│  │    GET  /?organizationId - List projects                             │  │
│  │    POST /                - Create project                            │  │
│  │                                                                       │  │
│  │  /tasks                                                               │  │
│  │    GET  /?organizationId&projectId - List tasks                      │  │
│  │    POST /                           - Create task                    │  │
│  │    PATCH /:taskId/status            - Update status                  │  │
│  │    PATCH /:taskId/assignee          - Update assignee                │  │
│  │                                                                       │  │
│  │  /comments                                                            │  │
│  │    GET  /?taskId         - List comments                             │  │
│  │    POST /                - Create comment                            │  │
│  │                                                                       │  │
│  │  /notifications                                                       │  │
│  │    GET  /?organizationId&page&pageSize - List notifications          │  │
│  │    POST /:id/read                      - Mark as read                │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      Middleware & Config                             │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  - requireAuth (JWT validation)                                      │  │
│  │  - errorHandler (Global error handling)                              │  │
│  │  - CORS (Frontend origin)                                            │  │
│  │  - Helmet (Security headers)                                         │  │
│  │  - Rate Limiting (1000 req/15min)                                    │  │
│  │  - Pino Logger (Structured logging)                                  │  │
│  │  - Swagger/OpenAPI (API docs)                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      Event Publishers                                │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  publishTaskAssigned()        → BullMQ Queue                         │  │
│  │  publishTaskStatusUpdated()   → BullMQ Queue                         │  │
│  │  publishCommentAdded()        → BullMQ Queue                         │  │
│  │  publishUserInvited()         → BullMQ Queue                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└───────────────┬───────────────────────────────────┬───────────────────────┘
                │                                   │
                │                                   │
        ┌───────▼────────┐                 ┌────────▼────────┐
        │   PostgreSQL   │                 │     Redis       │
        │   (Prisma)     │                 │   (BullMQ)      │
        ├────────────────┤                 ├─────────────────┤
        │ - User         │                 │ - Job Queue     │
        │ - Organization │                 │ - Dead Letter   │
        │ - Membership   │                 │ - Job Status    │
        │ - Project      │                 └────────┬────────┘
        │ - Task         │                          │
        │ - Comment      │                          │
        │ - Notification │                          │
        │ - RefreshToken │                          │
        │ - AuditLog     │                          │
        └────────────────┘                          │
                                                    │
                                          ┌─────────▼─────────┐
                                          │   WORKER PROCESS  │
                                          ├───────────────────┤
                                          │ BullMQ Consumer   │
                                          │                   │
                                          │ Job Handlers:     │
                                          │ - TASK_ASSIGNED   │
                                          │ - TASK_STATUS_    │
                                          │   UPDATED         │
                                          │ - COMMENT_ADDED   │
                                          │ - USER_INVITED    │
                                          │                   │
                                          │ Creates:          │
                                          │ - Notifications   │
                                          │   in Database     │
                                          │                   │
                                          │ Retry: 5 attempts │
                                          │ Backoff: Exp.     │
                                          └───────────────────┘
```

---

## 🔄 Complete Data Flow Examples

### 1. User Creates Task with Assignee
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /tasks { title, assigneeId }
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 2. Create task in DB
       │ 3. publishTaskAssigned()
       ▼
┌─────────────┐
│    Redis    │
└──────┬──────┘
       │ 4. Job queued
       ▼
┌─────────────┐
│   Worker    │
└──────┬──────┘
       │ 5. Consume job
       │ 6. Create notification in DB
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ 7. Notification saved
       ▼
┌─────────────┐
│   Browser   │ 8. GET /notifications
└─────────────┘    9. User sees notification
```

### 2. User Adds Comment on Task
```
┌─────────────┐
│   Browser   │ Click task card
└──────┬──────┘
       │ 1. Navigate to /tasks/:taskId
       │ 2. GET /comments?taskId=xxx
       ▼
┌─────────────┐
│   Backend   │ Return comments
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Browser   │ Display task detail + comments
└──────┬──────┘
       │ 3. User types comment
       │ 4. POST /comments { taskId, content }
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 5. Create comment in DB
       │ 6. publishCommentAdded()
       ▼
┌─────────────┐
│    Redis    │
└──────┬──────┘
       │ 7. Job queued
       ▼
┌─────────────┐
│   Worker    │
└──────┬──────┘
       │ 8. Check if task has assignee
       │ 9. Create notification for assignee
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ 10. Notification saved
       ▼
┌─────────────┐
│   Browser   │ 11. Assignee sees notification
└─────────────┘     (in dropdown or page)
```

### 3. User Views Notifications
```
┌─────────────┐
│   Browser   │ Click "Notifications" in sidebar
└──────┬──────┘
       │ 1. Navigate to /notifications
       │ 2. GET /notifications?organizationId=xxx
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 3. Query notifications from DB
       │    WHERE userId = current_user
       │    AND organizationId = xxx
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ 4. Return notifications
       ▼
┌─────────────┐
│   Browser   │ 5. Display unread/read sections
└──────┬──────┘
       │ 6. User clicks unread notification
       │ 7. POST /notifications/:id/read
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 8. Update notification.read = true
       ▼
┌─────────────┐
│ PostgreSQL  │
└──────┬──────┘
       │ 9. Notification updated
       ▼
┌─────────────┐
│   Browser   │ 10. Move to "Read" section
└─────────────┘     11. Update unread count
```

---

## 🎯 Feature Coverage Map

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                            │
├─────────────────────────────────────────────────────────────┤
│ ✅ Email/Password Registration                              │
│ ✅ Email/Password Login                                     │
│ ✅ Google OAuth Login                                       │
│ ✅ JWT Access Tokens (15 min)                               │
│ ✅ Refresh Token Rotation (7 days)                          │
│ ✅ Protected Routes                                          │
│ ✅ Auto Token Refresh on 401                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ORGANIZATION MANAGEMENT                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ Create Organization                                       │
│ ✅ List Organizations                                        │
│ ✅ Organization Selector                                     │
│ ✅ Multi-tenancy (organizationId scoping)                   │
│ ✅ Auto ADMIN role for creator                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   MEMBERSHIP MANAGEMENT                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ List Members                                              │
│ ✅ Invite User by Email                                      │
│ ✅ Role-based Access (ADMIN/MANAGER/MEMBER)                 │
│ ✅ Permission Checks                                         │
│ ✅ Invite Notification                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PROJECT MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│ ✅ Create Project                                            │
│ ✅ List Projects                                             │
│ ✅ Organization Scoping                                      │
│ ✅ Project Filter in Task Board                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     TASK MANAGEMENT                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ Create Task                                               │
│ ✅ List Tasks                                                │
│ ✅ Update Task Status (TODO/IN_PROGRESS/DONE)               │
│ ✅ Update Task Assignee                                      │
│ ✅ Kanban Board View                                         │
│ ✅ Task Detail Page ✨                                       │
│ ✅ Clickable Task Cards ✨                                   │
│ ✅ Assignment Notification                                   │
│ ✅ Status Update Notification                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     COMMENT SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│ ✅ Create Comment                                            │
│ ✅ List Comments                                             │
│ ✅ Comment UI on Task Detail ✨                              │
│ ✅ Author Attribution                                        │
│ ✅ Timestamps                                                │
│ ✅ Comment Notification                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ List Notifications                                        │
│ ✅ Mark as Read                                              │
│ ✅ Notifications Dropdown                                    │
│ ✅ Notifications Page ✨                                     │
│ ✅ Unread/Read Sections ✨                                   │
│ ✅ Unread Count Badge                                        │
│ ✅ Organization Filter                                       │
│ ✅ Pagination                                                │
│ ✅ 4 Notification Types:                                     │
│    - TASK_ASSIGNED                                           │
│    - TASK_STATUS_UPDATED                                     │
│    - COMMENT_ADDED                                           │
│    - USER_INVITED                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                EVENT-DRIVEN ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ BullMQ Queue                                              │
│ ✅ Redis Connection                                          │
│ ✅ Worker Process                                            │
│ ✅ 4 Event Publishers                                        │
│ ✅ 4 Job Handlers                                            │
│ ✅ Retry Logic (5 attempts)                                  │
│ ✅ Exponential Backoff                                       │
│ ✅ Dead Letter Queue                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Implementation Statistics

### Backend
- **Total Endpoints:** 20+
- **Modules:** 8 (auth, user, org, membership, project, task, comment, notification)
- **Event Types:** 4
- **Worker Handlers:** 4
- **Middleware:** 6+
- **Database Models:** 8

### Frontend
- **Pages:** 8 (Login, Register, Dashboard, Projects, TaskBoard, TaskDetail✨, Notifications✨, Profile)
- **Components:** 4 (Layout, ProtectedRoute, NotificationsDropdown, etc.)
- **Hooks:** 2 (useAuth, useOrg)
- **Routes:** 10+

### Infrastructure
- **Docker Services:** 6 (postgres, redis, backend, worker, frontend, pgadmin)
- **Environment Variables:** 10+
- **CI/CD:** GitHub Actions

---

## ✨ New Features Highlighted

```
🆕 Task Detail Page
   - View complete task information
   - Update status inline
   - View all comments
   - Add new comments
   - Navigate back to board

🆕 Notifications Page
   - Dedicated full-page view
   - Unread/Read sections
   - Click to mark as read
   - Organization filter
   - Type badges

🆕 Enhanced Navigation
   - Clickable task cards
   - Notifications sidebar link
   - Task detail routing
```

---

## 🎉 Result

**TeamSync is now 100% feature-complete with all documented functionality implemented end-to-end!**

✅ = Implemented and Working
✨ = Newly Added Feature
