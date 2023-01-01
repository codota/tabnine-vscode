import * as vscode from "vscode";
import {
  getNotifications,
  Notification,
  sendNotificationAction,
} from "../binary/requests/notifications";
import executeNotificationAction from "./executeNotificationAction";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  StatePayload,
} from "../globals/consts";
import { assertFirstTimeReceived } from "../utils/utils";
import setState from "../binary/requests/setState";
import { isInTheLastHours } from "../utils/time.utils";
import { State } from "../binary/state";
import {
  CONNECTION_LOST_NOTIFICATION_ID_PREFIX,
  CONNECTION_LOST_NOTIFICATION_PROPS,
  INTERVAL_BETWEEN_CONNECTION_LOST_NOTIFICATIONS_HOURS,
} from "./connectionHealthNotification";
import { onStateChangedEmitter } from "../events/onStateChangedEmitter";

let lastConnectionLostNotificationTime: Date;

let pollingInterval: NodeJS.Timeout | null = null;

export default function pollNotifications(
  context: vscode.ExtensionContext
): void {
  onStateChangedEmitter.event(
    (state) => void handleConnectionHealthStatus(context, state)
  );

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

export async function doPollNotifications(
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

async function handleConnectionHealthStatus(
  context: vscode.ExtensionContext,
  state: State
): Promise<void> {
  if (shouldShowConnectionLostNotification(state)) {
    lastConnectionLostNotificationTime = new Date();
    await handleNotification(createConnectionLostNotification(), context);
  }
}

function createConnectionLostNotification() {
  return {
    id: `${CONNECTION_LOST_NOTIFICATION_ID_PREFIX}_${Date.now()}`,
    ...CONNECTION_LOST_NOTIFICATION_PROPS,
  };
}

function shouldShowConnectionLostNotification(state?: State | null) {
  return (
    state?.cloud_connection_health_status === "Failed" &&
    (!lastConnectionLostNotificationTime ||
      !isInTheLastHours(
        lastConnectionLostNotificationTime,
        INTERVAL_BETWEEN_CONNECTION_LOST_NOTIFICATIONS_HOURS
      ))
  );
}

async function handleNotification(
  { id, message, notification_type, options, state }: Notification,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await assertFirstTimeReceived(id, context);

    void setState({
      [StatePayload.NOTIFICATION_SHOWN]: {
        id,
        text: message,
        notification_type,
        state,
      },
    });

    return await vscode.window
      .showInformationMessage(message, ...options.map((option) => option.key))
      .then((selected) => {
        const selectedAction = options.find(({ key }) => key === selected);
        void sendNotificationAction(
          id,
          message,
          selected,
          notification_type,
          selectedAction?.actions,
          state
        );
        void executeNotificationAction(selectedAction?.actions);
      });
  } catch (error) {
    // This is OK, as we prevented the same popup to appear twice.
    return Promise.resolve();
  }
}
