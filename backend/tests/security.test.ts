import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('keamanan endpoint', () => {
  it('menolak akses data pribadi tanpa token', async () => {
    const response = await request(app).get('/api/me/registrations');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Silakan login terlebih dahulu');
  });

  it('menolak akses statistik admin tanpa token', async () => {
    const response = await request(app).get('/api/stats');

    expect(response.status).toBe(401);
  });

  it('menolak token yang tidak valid', async () => {
    const response = await request(app)
      .get('/api/me/registrations')
      .set('Authorization', 'Bearer token-palsu');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('tidak valid');
  });

  it('tidak membocorkan header x-powered-by', async () => {
    const response = await request(app).get('/healthz');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
