import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';

const accessTokenTtlSeconds = 15 * 60;
const refreshTokenTtlSeconds = 7 * 24 * 60 * 60;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface JwtPayload {
  sub: string;
  email: string;
}

function signAccessToken(user: User) {
  const payload: JwtPayload = { sub: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: accessTokenTtlSeconds,
  });
}

async function createRefreshToken(user: User): Promise<string> {
  const secret = randomBytes(32).toString('base64url');
  const tokenHash = await argon2.hash(secret);
  const expiresAt = new Date(Date.now() + refreshTokenTtlSeconds * 1000);

  const dbToken = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return `${dbToken.id}.${secret}`;
}

export async function registerLocalUser(params: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    throw new AppError('Email already registered', 400);
  }
  const passwordHash = await argon2.hash(params.password);
  const user = await prisma.user.create({
    data: {
      email: params.email,
      passwordHash,
      name: params.name,
    },
  });
  const accessToken = signAccessToken(user);
  const refresh = await createRefreshToken(user);
  return { user, accessToken, refreshToken: refresh };
}

export async function loginLocalUser(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: params.email } });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401);
  }
  const valid = await argon2.verify(user.passwordHash, params.password);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }
  const accessToken = signAccessToken(user);
  const refresh = await createRefreshToken(user);
  return { user, accessToken, refreshToken: refresh };
}

export async function rotateRefreshToken(rawToken: string) {
  const [tokenId, secret] = rawToken.split('.');
  if (!tokenId || !secret) {
    throw new AppError('Invalid refresh token', 401);
  }

  const token = await prisma.refreshToken.findFirst({
    where: { id: tokenId, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (!token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const valid = await argon2.verify(token.tokenHash, secret).catch(() => false);
  if (!valid) {
    throw new AppError('Invalid refresh token', 401);
  }

  await prisma.refreshToken.update({ where: { id: token.id }, data: { revoked: true } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: token.userId } });
  const accessToken = signAccessToken(user);
  const refresh = await createRefreshToken(user);
  return { user, accessToken, refreshToken: refresh };
}

export async function authenticateGoogle(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError('Invalid Google token', 400);
  }

  const email = payload.email;
  const providerId = payload.sub;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: payload.name || email,
        provider: 'GOOGLE',
        providerId,
      },
    });
  }

  const accessToken = signAccessToken(user);
  const refresh = await createRefreshToken(user);
  return { user, accessToken, refreshToken: refresh };
}

