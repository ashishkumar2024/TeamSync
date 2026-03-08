import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { notificationDeadLetterQueue, notificationQueueName } from '../config/bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

async function handleJob(job: Job) {
  const data = job.data as any;

  switch (data.type) {
    case 'TASK_ASSIGNED': {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          organizationId: data.organizationId,
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          body: `You have been assigned to task "${data.title}"`,
          data: {
            taskId: data.taskId,
            actorId: data.actorId,
          },
        },
      });
      break;
    }
    case 'TASK_STATUS_UPDATED': {
      await prisma.notification.create({
        data: {
          userId: data.actorId,
          organizationId: data.organizationId,
          type: 'TASK_STATUS_UPDATED',
          title: 'Task status updated',
          body: `Task status updated to ${data.status}`,
          data: {
            taskId: data.taskId,
          },
        },
      });
      break;
    }
    case 'COMMENT_ADDED': {
      const task = await prisma.task.findUnique({
        where: { id: data.taskId },
        select: { assigneeId: true },
      });
      if (task?.assigneeId && task.assigneeId !== data.authorId) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            organizationId: data.organizationId,
            type: 'COMMENT_ADDED',
            title: 'New comment on task',
            body: 'Someone added a comment to a task assigned to you',
            data: {
              taskId: data.taskId,
              commentId: data.commentId,
              authorId: data.authorId,
            },
          },
        });
      }
      break;
    }
    case 'USER_INVITED': {
      await prisma.notification.create({
        data: {
          userId: data.inviteeId,
          organizationId: data.organizationId,
          type: 'USER_INVITED',
          title: 'You were invited to an organization',
          body: 'You have been added to an organization',
          data: {
            inviterId: data.inviterId,
          },
        },
      });
      break;
    }
    default:
      logger.warn({ data }, 'Unknown notification type');
  }
}

async function startWorker() {
  const worker = new Worker(
    notificationQueueName,
    async (job) => {
      try {
        await handleJob(job);
      } catch (err) {
        logger.error({ err, jobId: job.id }, 'Job processing failed');
        throw err;
      }
    },
    {
      connection: redisConnection as any,
      concurrency: 5,
    },
  );

  worker.on('failed', async (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Job failed');
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      await notificationDeadLetterQueue.add(
        'dead-letter',
        {
          failedAt: new Date().toISOString(),
          originalJob: job.toJSON(),
          error: err?.message,
        },
        { removeOnComplete: 1000, removeOnFail: 1000 },
      );
    }
  });

  logger.info('Notification worker started');
}

void startWorker();

