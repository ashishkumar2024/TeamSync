import { Router } from 'express';
import { z } from 'zod';
import { registerLocalUser, loginLocalUser, rotateRefreshToken, authenticateGoogle } from './auth.service';
import { AppError } from '../../shared/errors';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const googleSchema = z.object({
  idToken: z.string().min(1),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }
  const { user, accessToken, refreshToken } = await registerLocalUser(parsed.data);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }
  const { user, accessToken, refreshToken } = await loginLocalUser(parsed.data);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }
  const { user, accessToken, refreshToken } = await rotateRefreshToken(parsed.data.refreshToken);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/google', async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid payload', 400, parsed.error.flatten());
  }
  const { user, accessToken, refreshToken } = await authenticateGoogle(parsed.data.idToken);
  res.json({ user, accessToken, refreshToken });
});

