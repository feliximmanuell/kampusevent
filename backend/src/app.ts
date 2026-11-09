import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRouter from './modules/auth';
import eventsRouter from './modules/events';
import registrationsRouter from './modules/registrations';
import meRouter from './modules/me';
import statsRouter from './modules/stats';
import healthRouter from './modules/health';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((item) => item.trim()),
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.use(healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/registrations', registrationsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/stats', statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
