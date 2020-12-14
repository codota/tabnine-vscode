import { tabNineProcess } from "./requests";

export enum NotificationActions {
  NONE = 0,
}

export type Notification = {
  id: string;
  message: string;
  options: {
    key: string;
    action: NotificationActions;
  }[];
  notification_type: string;
};

export type Notifications = {
  notifications: Notification[];
};

export function getNotifications(): Promise<Notifications | null | undefined> {
  return tabNineProcess.request<Notifications>({ Notifications: {} });
}

type NotificationAction = Record<string, unknown>;

export async function sendNotificationAction(
  id: string,
  message: string,
  selected: string | undefined,
  notification_type: string,
): Promise<NotificationAction | null | undefined> {
  return tabNineProcess.request<NotificationAction>({
    NotificationAction: { id, selected, message, notification_type},
  });
}
