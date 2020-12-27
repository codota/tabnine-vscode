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
  {id, message, notification_type, options}: Notification,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await assertFirstTimeReceived(id, context);

    void setState({
      [StatePayload.NOTIFICATION_SHOWN]: { text: message, notification_type},
    });

    return vscode.window
      .showInformationMessage(
        message,
        ...options.map((option) => option.key)
      )
      .then((selected) => {
        const selectedAction = options.find(
          ({ key }) => key === selected
        );
        void sendNotificationAction(id, message, selected, notification_type, selectedAction?.actions);
        void executeNotificationAction(selectedAction?.actions);
      });
  } catch (error) {
    // This is OK, as we prevented the same popup to appear twice.
    return Promise.resolve();
  }
}
