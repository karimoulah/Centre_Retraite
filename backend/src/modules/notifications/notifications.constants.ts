export const NOTIFICATIONS_QUEUE = 'notifications';
/** 3 attempts, 1 min then 2 min apart (B5-03). */
export const MAX_ATTEMPTS = 3;
export const RETRY_BACKOFF = { type: 'exponential', delay: 60_000 } as const;
export type NotificationJob = { notificationId: string };
