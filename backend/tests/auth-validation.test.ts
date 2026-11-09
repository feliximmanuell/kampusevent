import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('validasi input auth (tanpa database)', () => {
  it('menolak registrasi dengan email tidak valid', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Budi', email: 'bukan-email', password: 'rahasia123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('tidak valid');
    expect(response.body.details.email).toBeDefined();
  });

  it('menolak registrasi dengan password terlalu pendek', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Budi', email: 'budi@kampus.ac.id', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.details.password).toBeDefined();
  });

  it('menolak login tanpa password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'budi@kampus.ac.id' });

    expect(response.status).toBe(400);
  });
});
