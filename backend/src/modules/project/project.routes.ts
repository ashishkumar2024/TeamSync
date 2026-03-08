import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';

export const projectRouter = Router();

const createProjectSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

projectRouter.use(requireAuth);

projectRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { organizationId } = req.query;
  if (!organizationId || typeof organizationId !== 'string') {
    throw new AppError('organizationId is required', 400);
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      organization: { memberships: { some: { userId: req.user!.id } } },
    },
  });
  res.json(projects);
});

projectRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
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

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      organizationId: parsed.data.organizationId,
    },
  });
  res.status(201).json(project);
});

