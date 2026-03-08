import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/user/user.routes';
import { organizationRouter } from '../modules/organization/organization.routes';
import { membershipRouter } from '../modules/membership/membership.routes';
import { projectRouter } from '../modules/project/project.routes';
import { taskRouter } from '../modules/task/task.routes';
import { commentRouter } from '../modules/comment/comment.routes';
import { notificationRouter } from '../modules/notification/notification.routes';

export function createRouter(): Router {
  const router = Router();

  router.use('/auth', authRouter);
  router.use('/users', userRouter);
  router.use('/organizations', organizationRouter);
  router.use('/memberships', membershipRouter);
  router.use('/projects', projectRouter);
  router.use('/tasks', taskRouter);
  router.use('/comments', commentRouter);
  router.use('/notifications', notificationRouter);

  return router;
}

