import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const notificationQueueName = 'notifications';
export const notificationDeadLetterQueueName = 'notifications_dead_letter';

export const notificationQueue = new Queue(notificationQueueName, {
  connection: redisConnection as any,
});
export const notificationDeadLetterQueue = new Queue(
  notificationDeadLetterQueueName,
  { connection: redisConnection as any },
);

