import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://kampusevent:kampusevent@localhost:5432/kampusevent?schema=public',
      JWT_SECRET: 'test-secret-key-with-enough-length',
    },
  },
});
