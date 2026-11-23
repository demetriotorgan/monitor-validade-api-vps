// src/worker/config.ts
export const config = {
  intervaloMs: Number(process.env.WORKER_INTERVALO_MS ?? 60 * 60 * 1000),
};