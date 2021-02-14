import { MessageActions } from "../../consts";
import { tabNineProcess } from "./requests";

export type Notification = {
  id: string;
  message: string;
  options: {
    key: string;
    actions: MessageActions[];
  }[];
  notification_type: unknown;
  state: unknown;
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
  notification_type: unknown,
  actions: MessageActions[] | undefined,
  state: unknown
): Promise<NotificationAction | null | undefined> {
  return tabNineProcess.request<NotificationAction>({
    NotificationAction: {
      id,
      selected,
      message,
      notification_type,
      actions,
      state,
    },
  });
}
