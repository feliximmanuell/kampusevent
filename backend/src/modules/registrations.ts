import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/async-handler';
import { forbidden, notFound } from '../utils/http-error';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      throw notFound('Registrasi tidak ditemukan');
    }

    if (registration.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw forbidden('Anda hanya dapat membatalkan registrasi milik sendiri');
    }

    await prisma.registration.delete({ where: { id: registration.id } });
    res.status(204).send();
  }),
);

export default router;
