import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('registrasi event - validasi akses', () => {
  it('menolak registrasi event tanpa token', async () => {
    const response = await request(app)
      .post('/api/events/1/registrations')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBeDefined();
  });

  it('menolak pembatalan registrasi tanpa token', async () => {
    const response = await request(app).delete('/api/registrations/1');

    expect(response.status).toBe(401);
  });
});
