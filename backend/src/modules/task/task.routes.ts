import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';
import { publishTaskAssigned, publishTaskStatusUpdated } from '../events/taskEvents';

export const taskRouter = Router();

const createTaskSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

const updateAssigneeSchema = z.object({
  assigneeId: z.string().nullable(),
});

taskRouter.use(requireAuth);

taskRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { organizationId, projectId } = req.query;
  if (!organizationId || typeof organizationId !== 'string') {
    throw new AppError('organizationId is required', 400);
  }

  const where: any = {
    organizationId,
    project: { organization: { memberships: { some: { userId: req.user!.id } } } },
  };
  if (projectId && typeof projectId === 'string') {
    where.projectId = projectId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { assignee: true },
  });
  res.json(tasks);
});

taskRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: parsed.data.organizationId,
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const task = await prisma.task.create({
    data: {
      organizationId: parsed.data.organizationId,
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      assigneeId: parsed.data.assigneeId,
    },
  });

  if (parsed.data.assigneeId) {
    await publishTaskAssigned({
      organizationId: parsed.data.organizationId,
      taskId: task.id,
      assigneeId: parsed.data.assigneeId,
      actorId: req.user!.id,
      title: task.title,
    });
  }

  res.status(201).json(task);
});

taskRouter.patch('/:taskId/status', async (req: AuthenticatedRequest, res) => {
  const { taskId } = req.params;
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }

  const existing = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: existing.organizationId,
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: parsed.data.status },
  });

  await publishTaskStatusUpdated({
    organizationId: existing.organizationId,
    taskId: task.id,
    actorId: req.user!.id,
    status: task.status,
  });

  res.json(task);
});

taskRouter.patch('/:taskId/assignee', async (req: AuthenticatedRequest, res) => {
  const { taskId } = req.params;
  const parsed = updateAssigneeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: existing.organizationId,
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: parsed.data.assigneeId ?? undefined },
    include: { assignee: true },
  });

  if (parsed.data.assigneeId) {
    await publishTaskAssigned({
      organizationId: existing.organizationId,
      taskId: task.id,
      assigneeId: parsed.data.assigneeId,
      actorId: req.user!.id,
      title: task.title,
    });
  }

  res.json(task);
});

