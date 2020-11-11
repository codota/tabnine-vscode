import * as vscode from "vscode";
import {
  getNotifications,
  Notification,
  sendNotificationAction,
} from "../binary/requests/notifications";
import executeNotificationAction from "./executeNotificationAction";
import { BINARY_NOTIFICATION_POLLING_INTERVAL } from "../consts";
import { assertFirstTimeRecieved } from "../utils";

export default function pollNotifications(
  context: vscode.ExtensionContext
): void {
  setInterval(
    () => void doPollNotifications(context),
    BINARY_NOTIFICATION_POLLING_INTERVAL
  );
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
    await assertFirstTimeRecieved(notification.id, context);

    return vscode.window
      .showInformationMessage(
        notification.message,
        ...notification.options.map((option) => option.key)
      )
      .then((selected) => {
        void sendNotificationAction(notification.id, selected);
        void executeNotificationAction(notification, selected);
      });
  } catch (error) {
    // This is OK, as we prevented the same popup to appear twice.
    return Promise.resolve();
  }
}
