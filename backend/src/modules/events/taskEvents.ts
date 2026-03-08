import { notificationQueue } from '../../config/bullmq';

export async function publishTaskAssigned(payload: {
  organizationId: string;
  taskId: string;
  assigneeId: string;
  actorId: string;
  title: string;
}) {
  await notificationQueue.add(
    'task-assigned',
    {
      type: 'TASK_ASSIGNED',
      ...payload,
    },
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  );
}

export async function publishTaskStatusUpdated(payload: {
  organizationId: string;
  taskId: string;
  actorId: string;
  status: string;
}) {
  await notificationQueue.add(
    'task-status-updated',
    {
      type: 'TASK_STATUS_UPDATED',
      ...payload,
    },
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  );
}

