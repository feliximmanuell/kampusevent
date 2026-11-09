import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('health endpoints', () => {
  it('GET /healthz mengembalikan status ok', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.uptime).toBe('number');
  });

  it('GET /api/tidak-ada mengembalikan 404 dalam format JSON', async () => {
    const response = await request(app).get('/api/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Endpoint tidak ditemukan');
  });
});
