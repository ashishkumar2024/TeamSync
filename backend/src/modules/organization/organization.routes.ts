import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';

export const organizationRouter = Router();

const createOrgSchema = z.object({
  name: z.string().min(1),
});

organizationRouter.use(requireAuth);

organizationRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const orgs = await prisma.organization.findMany({
    where: { memberships: { some: { userId: req.user!.id } } },
  });
  res.json(orgs);
});

organizationRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = createOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }
  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      memberships: {
        create: {
          userId: req.user!.id,
          role: 'ADMIN',
        },
      },
    },
  });
  res.status(201).json(org);
});

