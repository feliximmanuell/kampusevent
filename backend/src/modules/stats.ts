import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const now = new Date();

    const [totalEvents, upcomingEvents, totalStudents, totalRegistrations, categories, topEvents] =
      await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { startsAt: { gte: now } } }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.registration.count(),
        prisma.event.groupBy({
          by: ['category'],
          _count: { _all: true },
          orderBy: { _count: { category: 'desc' } },
        }),
        prisma.event.findMany({
          take: 5,
          include: { _count: { select: { registrations: true } } },
          orderBy: { registrations: { _count: 'desc' } },
          where: { startsAt: { gte: now } },
        }),
      ]);

    res.json({
      stats: {
        totalEvents,
        upcomingEvents,
        totalStudents,
        totalRegistrations,
        byCategory: categories.map((item) => ({
          category: item.category,
          total: item._count._all,
        })),
        topEvents: topEvents.map((event) => ({
          id: event.id,
          title: event.title,
          startsAt: event.startsAt,
          capacity: event.capacity,
          registeredCount: event._count.registrations,
        })),
      },
    });
  }),
);

export default router;
