#!/bin/sh
set -e

echo "[entrypoint] Menunggu database dan menjalankan migrasi..."
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] Menjalankan seed data (idempotent)..."
  node prisma/seed.js || echo "[entrypoint] Seed dilewati karena error."
fi

echo "[entrypoint] Menjalankan aplikasi..."
exec "$@"
