import * as vscode from "vscode";
import {
  getNotifications,
  Notification,
  sendNotificationAction,
} from "../binary/requests/notifications";
import executeNotificationAction from "./executeNotificationAction";
import { BINARY_NOTIFICATION_POLLING_INTERVAL } from "../consts";

export default function pollNotifications(): void {
  setInterval(
    () => void doPollNotifications(),
    BINARY_NOTIFICATION_POLLING_INTERVAL
  );
}

async function doPollNotifications(): Promise<void> {
  const notifications = await getNotifications();

  if (!notifications || !notifications.notifications) {
    return;
  }

  notifications.notifications.forEach(
    (notification) => void handleNotification(notification)
  );
}

async function handleNotification(notification: Notification): Promise<void> {
  return vscode.window
    .showInformationMessage(
      notification.message,
      ...notification.options.map((option) => option.key)
    )
    .then((selected) => {
      void sendNotificationAction(notification.id, selected);
      void executeNotificationAction(notification, selected);
    });
}
