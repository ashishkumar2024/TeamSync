# Testing Guide for New Features

## 🆕 New Features Added

### 1. Task Detail Page with Comments
### 2. Dedicated Notifications Page

---

## 🧪 How to Test

### Prerequisites
1. Start the application:
   ```bash
   docker-compose up --build
   ```
   OR for dev mode:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

2. Run migrations and seed:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx ts-node prisma/seed.ts
   ```

3. Access frontend: http://localhost:5173

---

## Test Scenario 1: Task Detail Page & Comments

### Step 1: Create a Task
1. Login to the application
2. Navigate to "Tasks" page
3. Click "New task" button
4. Fill in:
   - Project: Select any project
   - Title: "Test Task for Comments"
   - Description: "Testing the new task detail page"
   - Assignee: Select yourself or another user
5. Click "Create"

### Step 2: View Task Details
1. On the Task Board, click on the task card you just created
2. You should be redirected to `/tasks/{taskId}`
3. Verify you see:
   - Task title and description
   - Status dropdown (TODO/IN_PROGRESS/DONE)
   - Assignee information
   - Comments section (empty initially)
   - "Add a comment" form

### Step 3: Add Comments
1. In the comment textarea, type: "This is my first comment"
2. Click "Post comment"
3. Verify:
   - Comment appears in the list
   - Shows your name
   - Shows timestamp
   - Comment form is cleared

4. Add another comment: "This is a follow-up comment"
5. Verify both comments are visible

### Step 4: Update Task Status
1. Change status from "TODO" to "IN_PROGRESS" using dropdown
2. Verify status updates immediately
3. Click "← Back" to return to Task Board
4. Verify task moved to "IN_PROGRESS" column

### Expected Notifications:
- If task has an assignee (not you), they get "New task assigned" notification
- When you update status, you get "Task status updated" notification
- When you add a comment (and assignee is different), assignee gets "New comment on task" notification

---

## Test Scenario 2: Notifications Page

### Step 1: Generate Notifications
1. Create a task and assign it to yourself
2. Update the task status
3. Add a comment on the task
4. Invite a new member (if you're admin/manager)

### Step 2: View Notifications Dropdown
1. Look at the header (top right)
2. Click "Notifications" button
3. Verify:
   - Dropdown opens
   - Shows recent notifications
   - Unread notifications have blue background
   - Unread count badge shows correct number

### Step 3: View Notifications Page
1. Click "Notifications" in the left sidebar
2. You should see `/notifications` page
3. Verify:
   - Page shows two sections: "Unread" and "Read"
   - Unread notifications have blue background
   - Each notification shows:
     - Title
     - Body text
     - Timestamp
     - Type badge (e.g., "TASK ASSIGNED")
   - Organization selector at top right

### Step 4: Mark Notifications as Read
1. Click on any unread notification
2. Verify:
   - Notification moves from "Unread" to "Read" section
   - Background changes from blue to white
   - Unread count decreases in dropdown

### Step 5: Test with Multiple Organizations
1. Create a second organization
2. Create tasks in the new organization
3. Switch organizations using the dropdown
4. Verify notifications are filtered by selected organization

---

## Test Scenario 3: End-to-End Comment Notification Flow

### Setup: Two Users
- User A (you)
- User B (invite another user or use seeded user)

### Flow:
1. **User A:** Create a task and assign to User B
   - User B gets "New task assigned" notification

2. **User B:** Login and view notification
   - Click notification in dropdown
   - Navigate to task (click on task in Task Board)

3. **User B:** Add a comment: "I'm working on this"
   - User A gets "New comment on task" notification

4. **User A:** View notification and respond
   - Click notification → goes to task detail
   - See User B's comment
   - Add reply: "Great, let me know if you need help"

5. **User B:** Check notifications again
   - Should see new comment notification
   - Click to view task
   - See User A's reply

---

## Test Scenario 4: Navigation Flow

### Test Task Card Clicks
1. Go to Task Board (`/tasks`)
2. Click on any task card
3. Verify:
   - Redirects to `/tasks/{taskId}`
   - Shows task details
   - Hover effect works (shadow increases)

### Test Back Navigation
1. From task detail page, click "← Back"
2. Verify:
   - Returns to previous page (Task Board)
   - Task Board state is preserved

### Test Sidebar Navigation
1. Click "Notifications" in sidebar
2. Verify active state (darker background)
3. Click "Tasks" in sidebar
4. Verify active state switches

---

## 🐛 Common Issues & Solutions

### Issue: Comments not showing
**Solution:** Check that:
- Task exists and you have access to its organization
- Backend worker is running
- Comments API endpoint is accessible

### Issue: Notifications not appearing
**Solution:** Check that:
- Redis is running
- Worker container is running: `docker-compose ps`
- Check worker logs: `docker-compose logs worker`
- Verify BullMQ queue: Check Redis keys

### Issue: Task detail page shows "Task not found"
**Solution:** 
- Ensure you're a member of the task's organization
- Check browser console for API errors
- Verify task ID in URL is correct

### Issue: Can't mark notification as read
**Solution:**
- Check that notification belongs to your user
- Verify API endpoint: POST /notifications/:id/read
- Check browser network tab for errors

---

## 📊 Verification Checklist

### Task Detail Page
- [ ] Task title and description display correctly
- [ ] Status dropdown works and updates task
- [ ] Assignee information shows
- [ ] Comments list displays all comments
- [ ] Comment form submits successfully
- [ ] New comments appear immediately
- [ ] Author name and timestamp show for each comment
- [ ] Back button navigates correctly

### Notifications Page
- [ ] Page loads without errors
- [ ] Unread section shows unread notifications
- [ ] Read section shows read notifications
- [ ] Clicking unread notification marks it as read
- [ ] Notification moves to read section
- [ ] Organization filter works
- [ ] Notification types display correctly
- [ ] Timestamps are formatted properly
- [ ] Empty state shows when no notifications

### Navigation
- [ ] Sidebar "Notifications" link works
- [ ] Task cards are clickable
- [ ] Task detail route works
- [ ] Active nav states work correctly
- [ ] Back navigation preserves state

### Integration
- [ ] Creating task generates notification
- [ ] Updating status generates notification
- [ ] Adding comment generates notification
- [ ] Inviting user generates notification
- [ ] Notifications appear in both dropdown and page
- [ ] Unread count is accurate

---

## 🎉 Success Criteria

All features are working correctly if:
1. ✅ You can click a task and see its details
2. ✅ You can add comments on tasks
3. ✅ Comments appear immediately after posting
4. ✅ You can view all notifications on dedicated page
5. ✅ Unread/read sections work correctly
6. ✅ Clicking notifications marks them as read
7. ✅ All navigation links work
8. ✅ Event-driven notifications are created by worker
9. ✅ No console errors in browser
10. ✅ No errors in backend/worker logs

---

## 📝 API Endpoints Used

### Task Detail Page
- GET /api/v1/tasks?organizationId={id} - Fetch task
- GET /api/v1/comments?taskId={id} - Fetch comments
- POST /api/v1/comments - Create comment
- PATCH /api/v1/tasks/{id}/status - Update status

### Notifications Page
- GET /api/v1/organizations - Fetch orgs
- GET /api/v1/notifications?organizationId={id}&page=1&pageSize=50 - Fetch notifications
- POST /api/v1/notifications/{id}/read - Mark as read

---

## 🔍 Debugging Tips

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
```

### Check Database
Access pgAdmin at http://localhost:5050
- Email: admin@admin.com
- Password: admin

### Check Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Check Application > Local Storage for auth tokens

---

## 🚀 Quick Test Script

Run this sequence for a complete test:

1. Login as admin user
2. Create organization "Test Org"
3. Create project "Test Project"
4. Create task "Test Task" assigned to yourself
5. Click task card → view details
6. Add comment "Testing comments"
7. Update status to IN_PROGRESS
8. Click Notifications in sidebar
9. Verify 2-3 notifications appear
10. Click unread notification
11. Verify it moves to read section
12. Navigate back to task
13. Add another comment
14. Check notifications again

If all steps work, implementation is successful! ✅
