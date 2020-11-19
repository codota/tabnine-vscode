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
  selected: string | undefined
): Promise<NotificationAction | null | undefined> {
  return tabNineProcess.request<NotificationAction>({
    NotificationAction: { id, selected },
  });
}
