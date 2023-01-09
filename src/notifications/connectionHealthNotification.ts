import { MessageActions } from "../globals/consts";
import { State } from "../binary/state";
import { isInTheLastHours } from "../utils/time.utils";

const INTERVAL_BETWEEN_CONNECTION_LOST_NOTIFICATIONS_HOURS = 5;

const CONNECTION_LOST_NOTIFICATION_ID_PREFIX = "connection_lost_notification";

export const CONNECTION_LOST_NOTIFICATION_PROPS = {
  message:
    "Tabnine lost internet connection. If your internet is connected and you're seeing this message, contact Tabnine support.",
  notification_type: "System",
  options: [
    {
      key: "Dismiss",
      actions: [MessageActions.NONE],
    },
  ],
  state: null,
};

export function createConnectionLostNotification() {
  return {
    id: `${CONNECTION_LOST_NOTIFICATION_ID_PREFIX}_${Date.now()}`,
    ...CONNECTION_LOST_NOTIFICATION_PROPS,
  };
}

export function shouldShowConnectionLostNotification(
  lastConnectionLostNotificationTime: Date,
  state?: State | null
) {
  return (
    state?.cloud_connection_health_status === "Failed" &&
    (!lastConnectionLostNotificationTime ||
      !isInTheLastHours(
        lastConnectionLostNotificationTime,
        INTERVAL_BETWEEN_CONNECTION_LOST_NOTIFICATIONS_HOURS
      ))
  );
}
