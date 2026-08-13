// Pure UI-state helpers for the student notifications page. There is no
// `type` column on notifications — only title/message/read/created_at — so
// nothing here invents a notification type or category.

export interface NotificationLike {
  read: boolean;
}

export function countUnread(notifications: readonly NotificationLike[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

export function hasUnread(notifications: readonly NotificationLike[]): boolean {
  return notifications.some((notification) => !notification.read);
}
