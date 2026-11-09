import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/async-handler';
import { badRequest, conflict, notFound } from '../utils/http-error';
import { requireAuth, requireRole } from '../middleware/auth';
import { toEventDto, toRegistrationDto } from '../lib/serializers';

const router = Router();

const eventSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(120),
  description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter').max(2000),
  category: z.string().trim().min(2).max(40),
  location: z.string().trim().min(3).max(120),
  startsAt: z.coerce.date(),
  capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1').max(10000),
});

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

const eventInclude = {
  creator: { select: { id: true, name: true } },
  _count: { select: { registrations: true } },
} as const;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    const events = await prisma.event.findMany({
      where: {
        ...(query.category ? { category: query.category } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { location: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: eventInclude,
      orderBy: { startsAt: 'asc' },
    });

    const categories = await prisma.event.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    res.json({
      events: events.map(toEventDto),
      categories: categories.map((item) => item.category),
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: eventInclude,
    });

    if (!event) {
      throw notFound('Event tidak ditemukan');
    }

    res.json({ event: toEventDto(event) });
  }),
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = eventSchema.parse(req.body);
    if (input.startsAt.getTime() < Date.now()) {
      throw badRequest('Tanggal mulai event harus di masa depan');
    }

    const event = await prisma.event.create({
      data: { ...input, createdById: req.user!.id },
      include: eventInclude,
    });

    res.status(201).json({ event: toEventDto(event) });
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const input = eventSchema.parse(req.body);

    const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw notFound('Event tidak ditemukan');
    }

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: input,
      include: eventInclude,
    });

    res.json({ event: toEventDto(event) });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw notFound('Event tidak ditemukan');
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.get(
  '/:id/participants',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: eventInclude,
    });

    if (!event) {
      throw notFound('Event tidak ditemukan');
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId: req.params.id },
      include: {
        event: { include: { _count: { select: { registrations: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      event: toEventDto(event),
      participants: registrations.map(toRegistrationDto),
    });
  }),
);

router.post(
  '/:id/registrations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      throw notFound('Event tidak ditemukan');
    }

    if (event._count.registrations >= event.capacity) {
      throw conflict('Kuota event sudah penuh');
    }

    if (event.startsAt.getTime() < Date.now()) {
      throw badRequest('Event sudah dimulai');
    }

    const existing = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
    });

    if (existing) {
      throw conflict('Anda sudah terdaftar pada event ini');
    }

    const registration = await prisma.registration.create({
      data: { eventId: event.id, userId: req.user!.id },
      include: {
        event: { include: { _count: { select: { registrations: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ registration: toRegistrationDto(registration) });
  }),
);

export default router;
