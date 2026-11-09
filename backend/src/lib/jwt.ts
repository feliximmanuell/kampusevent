import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

const signOptions: jwt.SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ email: payload.email, role: payload.role }, env.JWT_SECRET, {
    ...signOptions,
    subject: payload.sub,
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Token tidak valid');
  }
  return {
    sub: String(decoded.sub),
    email: String(decoded.email ?? ''),
    role: decoded.role as Role,
  };
}
