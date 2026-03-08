import { notificationQueue } from '../../config/bullmq';

export async function publishUserInvited(payload: {
  organizationId: string;
  inviteeId: string;
  inviterId: string;
}) {
  await notificationQueue.add(
    'user-invited',
    {
      type: 'USER_INVITED',
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
