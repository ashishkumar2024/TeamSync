import { Router } from 'express';
import { prisma } from '../../config/database';
import { requireAuth, AuthenticatedRequest } from '../../shared/middleware/authMiddleware';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      provider: true,
      createdAt: true,
    },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
