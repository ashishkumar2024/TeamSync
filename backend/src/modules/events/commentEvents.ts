import { notificationQueue } from '../../config/bullmq';

export async function publishCommentAdded(payload: {
  organizationId: string;
  taskId: string;
  commentId: string;
  authorId: string;
}) {
  await notificationQueue.add(
    'comment-added',
    {
      type: 'COMMENT_ADDED',
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
