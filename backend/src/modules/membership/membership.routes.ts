import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';
import { publishUserInvited } from '../events/membershipEvents';

export const membershipRouter = Router();

const inviteSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
});

membershipRouter.use(requireAuth);

membershipRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { organizationId } = req.query;
  if (!organizationId || typeof organizationId !== 'string') {
    throw new AppError('organizationId is required', 400);
  }

  const memberships = await prisma.membership.findMany({
    where: {
      organizationId,
      organization: { memberships: { some: { userId: req.user!.id } } },
    },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(memberships);
});

membershipRouter.post('/invite', async (req: AuthenticatedRequest, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: req.user!.id,
      organizationId: parsed.data.organizationId,
      role: { in: ['ADMIN', 'MANAGER'] },
    },
  });
  if (!membership) {
    throw new AppError('Forbidden', 403);
  }

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!invitee) {
    throw new AppError('User not found', 404);
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: invitee.id,
        organizationId: parsed.data.organizationId,
      },
    },
  });
  if (existing) {
    throw new AppError('User already in organization', 400);
  }

  const newMembership = await prisma.membership.create({
    data: {
      userId: invitee.id,
      organizationId: parsed.data.organizationId,
      role: parsed.data.role as 'ADMIN' | 'MANAGER' | 'MEMBER',
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  await publishUserInvited({
    organizationId: parsed.data.organizationId,
    inviteeId: invitee.id,
    inviterId: req.user!.id,
  });

  res.status(201).json(newMembership);
});
