import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // Signature 4 argumen wajib agar Express mengenali sebagai error handler.
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message, details: error.details });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Data yang dikirim tidak valid',
      details: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: 'Data sudah ada (duplikat)' });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Data tidak ditemukan' });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', error);

  res.status(500).json({
    message: 'Terjadi kesalahan pada server',
    ...(env.NODE_ENV === 'production' ? {} : { detail: String(error) }),
  });
}
