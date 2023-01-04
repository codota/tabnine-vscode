import {
  MessageAction,
  MessageActionsEnum,
  OpenHubWithAction,
} from "../../globals/consts";
import { tabNineProcess } from "./requests";

export type Notification = {
  id: string;
  message: string;
  options: {
    key: string;
    actions: MessageAction[];
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
  actions: MessageAction[] | undefined,
  state: unknown
): Promise<NotificationAction | null | undefined> {
  return tabNineProcess.request<NotificationAction>({
    NotificationAction: {
      id,
      selected,
      message,
      notification_type,
      actions: actions?.filter(
        (action) =>
          ![
            MessageActionsEnum.OPEN_NOTIFICATIONS,
            MessageActionsEnum.OPEN_NOTIFICATIONS_IN_HUB,
          ].includes(action as MessageActionsEnum) &&
          !(action as OpenHubWithAction).OpenHubWith
      ),
      state,
    },
  });
}
