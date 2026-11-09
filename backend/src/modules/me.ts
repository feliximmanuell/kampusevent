import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middleware/auth';
import { toRegistrationDto } from '../lib/serializers';

const router = Router();

router.get(
  '/registrations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: {
        event: { include: { _count: { select: { registrations: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ registrations: registrations.map(toRegistrationDto) });
  }),
);

export default router;
