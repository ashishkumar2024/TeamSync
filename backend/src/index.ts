import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { logger } from './config/logger';
import { prisma } from './config/database';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await prisma.$connect();
    const server = createServer(app);

    server.listen(PORT, () => {
      logger.info({ port: PORT }, 'TeamSync backend listening');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void start();

