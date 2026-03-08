import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { createRouter } from './routes';
import { errorHandler } from './shared/middleware/errorHandler';
import { requestLogger } from './shared/middleware/requestLogger';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(
  pinoHttp({
    logger,
  }),
);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'teamsync-backend' });
});

app.use('/api/v1', createRouter());

setupSwagger(app);

app.use(errorHandler);

export default app;

