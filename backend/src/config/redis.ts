function parseRedisUrl(url: string) {
  // Supports: redis://[:password@]host:port[/db]
  const u = new URL(url);
  const host = u.hostname || 'localhost';
  const port = u.port ? parseInt(u.port, 10) : 6379;
  const password = u.password || undefined;
  const db = u.pathname?.length > 1 ? parseInt(u.pathname.slice(1), 10) : 0;
  return { host, port, password, db };
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const parsed = parseRedisUrl(redisUrl);

export const redisConnection = {
  host: parsed.host,
  port: parsed.port,
  password: parsed.password,
  db: parsed.db,
  maxRetriesPerRequest: null,
};

