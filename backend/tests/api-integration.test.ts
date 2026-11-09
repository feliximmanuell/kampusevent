/**
 * Test integrasi membutuhkan PostgreSQL.
 * Jalankan dengan: RUN_DB_TESTS=true DATABASE_URL=... npm test
 * Di CI, service container PostgreSQL disediakan otomatis.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const runDbTests = process.env.RUN_DB_TESTS === 'true';

const suffix = Date.now();
const adminEmail = `admin.${suffix}@test.local`;
const studentEmail = `student.${suffix}@test.local`;
const password = 'Rahasia123!';

let app: Express;
let adminToken = '';
let studentToken = '';
let eventId = '';

describe.skipIf(!runDbTests)('alur integrasi API KampusEvent', () => {
  beforeAll(async () => {
    app = createApp();

    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin Test', email: adminEmail, password })
      .expect(201);
    adminToken = adminRegister.body.token;

    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = login.body.token;

    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student Test', email: studentEmail, password })
      .expect(201);
    studentToken = studentRegister.body.token;
  });

  afterAll(async () => {
    await prisma.registration.deleteMany({
      where: { user: { email: { in: [adminEmail, studentEmail] } } },
    });
    await prisma.event.deleteMany({ where: { creator: { email: adminEmail } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, studentEmail] } } });
    await prisma.$disconnect();
  });

  it('admin dapat membuat event', async () => {
    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Event Integrasi Test',
        description: 'Event yang dibuat oleh test integrasi otomatis.',
        category: 'Seminar',
        location: 'Lab Test',
        startsAt,
        capacity: 2,
      })
      .expect(201);

    eventId = response.body.event.id;
    expect(response.body.event.title).toBe('Event Integrasi Test');
    expect(response.body.event.registeredCount).toBe(0);
  });

  it('mahasiswa dapat mendaftar event', async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/registrations`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(response.body.registration.status).toBe('CONFIRMED');
    expect(response.body.registration.event.registeredCount).toBe(1);
  });

  it('pendaftaran ganda ditolak dengan 409', async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/registrations`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(409);

    expect(response.body.message).toContain('sudah terdaftar');
  });

  it('event muncul pada daftar registrasi mahasiswa', async () => {
    const response = await request(app)
      .get('/api/me/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(response.body.registrations).toHaveLength(1);
    expect(response.body.registrations[0].event.id).toBe(eventId);
  });

  it('mahasiswa tidak boleh membuat event (403)', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Event Ilegal',
        description: 'Tidak boleh dibuat oleh mahasiswa.',
        category: 'Lainnya',
        location: 'Online',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        capacity: 10,
      })
      .expect(403);
  });
});
