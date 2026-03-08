import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';
import { publishCommentAdded } from '../events/commentEvents';

export const commentRouter = Router();

const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1),
});

commentRouter.use(requireAuth);

commentRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { taskId } = req.query;
  if (!taskId || typeof taskId !== 'string') {
    throw new AppError('taskId is required', 400);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: task.organizationId,
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(comments);
});

commentRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }

  const task = await prisma.task.findUnique({
    where: { id: parsed.data.taskId },
  });
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: task.organizationId,
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const comment = await prisma.comment.create({
    data: {
      taskId: parsed.data.taskId,
      authorId: req.user!.id,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  await publishCommentAdded({
    organizationId: task.organizationId,
    taskId: task.id,
    commentId: comment.id,
    authorId: req.user!.id,
  });

  res.status(201).json(comment);
});
