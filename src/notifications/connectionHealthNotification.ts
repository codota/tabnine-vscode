import { MessageActions } from "../globals/consts";

export const CONNECTION_LOST_NOTIFICATION_ID_PREFIX =
  "connection_lost_notification";

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

export const INTERVAL_BETWEEN_CONNECTION_LOST_NOTIFICATIONS_HOURS = 5;
