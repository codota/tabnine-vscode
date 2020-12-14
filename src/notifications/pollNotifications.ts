import * as vscode from "vscode";
import {
  getNotifications,
  Notification,
  sendNotificationAction,
} from "../binary/requests/notifications";
import executeNotificationAction from "./executeNotificationAction";
import { BINARY_NOTIFICATION_POLLING_INTERVAL, StatePayload } from "../consts";
import { assertFirstTimeReceived } from "../utils";
import setState from "../binary/requests/setState";

let pollingInterval: NodeJS.Timeout | null = null;

export default function pollNotifications(
  context: vscode.ExtensionContext
): void {
  pollingInterval = setInterval(
    () => void doPollNotifications(context),
    BINARY_NOTIFICATION_POLLING_INTERVAL
  );
}

export function cancelNotificationsPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
}

async function doPollNotifications(
  context: vscode.ExtensionContext
): Promise<void> {
  const notifications = await getNotifications();

  if (!notifications || !notifications.notifications) {
    return;
  }

  notifications.notifications.forEach(
    (notification) => void handleNotification(notification, context)
  );
}

async function handleNotification(
  notification: Notification,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await assertFirstTimeReceived(notification.id, context);

    void setState({
      [StatePayload.NOTIFICATION_SHOWN]: { text: notification.message, notification_type: notification.notification_type },
    });

    return vscode.window
      .showInformationMessage(
        notification.message,
        ...notification.options.map((option) => option.key)
      )
      .then((selected) => {
        void sendNotificationAction(notification.id, notification.message, selected, notification.notification_type);
        void executeNotificationAction(notification, selected);
      });
  } catch (error) {
    // This is OK, as we prevented the same popup to appear twice.
    return Promise.resolve();
  }
}
