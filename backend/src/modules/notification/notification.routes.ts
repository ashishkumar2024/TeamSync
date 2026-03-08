import { Router } from 'express';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { organizationId, page = '1', pageSize = '20' } = req.query;
  if (!organizationId || typeof organizationId !== 'string') {
    throw new AppError('organizationId is required', 400);
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize as string, 10) || 20, 100);

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        organizationId,
        userId: req.user!.id,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    }),
    prisma.notification.count({
      where: {
        organizationId,
        userId: req.user!.id,
      },
    }),
  ]);

  res.json({
    items,
    page: pageNum,
    pageSize: pageSizeNum,
    total,
  });
});

notificationRouter.post('/:id/read', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user!.id) {
    throw new AppError('Not found', 404);
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  res.json(updated);
});

